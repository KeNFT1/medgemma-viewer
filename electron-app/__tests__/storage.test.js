/**
 * @jest-environment jsdom
 */

// NOTE: The functions under test are copied from index.html. This is not
// ideal, but it allows us to test the logic without refactoring the original
// application structure. If this logic becomes more complex, it should be
// moved to a separate JavaScript file and imported.

describe('Thread Storage and Expiration', () => {
  let threads = [];
  let activeThread = null;

  // Mocks of functions and objects that are globally available in the app
  const addMessage = jest.fn();
  const deleteImageFromDB = jest.fn(() => Promise.resolve());
  const renderThreadList = jest.fn();
  const renderConversation = jest.fn();

  // --- Functions under test (copied from index.html) ---

  function saveThreadsToStorage() {
    try {
      const toStore = threads.map(t => ({
        ...t,
        conversationHistory: t.conversationHistory.map(m => ({ role: m.role, content: m.content }))
      }));
      localStorage.setItem('medgemma_threads', JSON.stringify(toStore));
    } catch (e) {
      if (e.name === 'QuotaExceededError') {
        addMessage('system-msg', 'Storage full. Delete some old threads to free space.');
      }
    }
  }

  function loadThreadsFromStorage() {
    const stored = localStorage.getItem('medgemma_threads');
    if (stored) {
      try {
        const loadedThreads = JSON.parse(stored);
        threads = loadedThreads.map(t => ({
          ...t,
          images: [],
          conversationHistory: t.conversationHistory.map(m => ({ ...m, images: [] }))
        }));
        const lastActiveId = localStorage.getItem('medgemma_last_active_thread');
        if (lastActiveId) {
          const lastActive = threads.find(t => t.id === lastActiveId);
          if (lastActive) {
            activeThread = lastActive;
          }
        }
        if (!activeThread && threads.length > 0) {
          activeThread = threads[0];
        }
        renderThreadList();
        renderConversation();
      } catch (e) {
        console.error('Could not parse threads from localStorage', e);
        localStorage.removeItem('medgemma_threads');
      }
    }
  }

  function cleanupExpiredThreads() {
    const cutoff = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const expired = threads.filter(t => !t.saved && t.createdAt < cutoff);
    expired.forEach(t => {
      (t.images || []).forEach(img => deleteImageFromDB(img.id).catch(() => {}));
    });
    threads = threads.filter(t => t.saved || t.createdAt >= cutoff);
    saveThreadsToStorage();
  }

  // --- Tests ---

  beforeEach(() => {
    threads = [];
    activeThread = null;
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should save and load threads correctly', () => {
    threads = [
      { id: '1', title: 'Thread 1', createdAt: Date.now(), saved: false, conversationHistory: [{role: 'user', content: 'hello'}] },
      { id: '2', title: 'Thread 2', createdAt: Date.now(), saved: true, conversationHistory: [] }
    ];

    saveThreadsToStorage();
    
    // Clear threads and load them back
    threads = [];
    loadThreadsFromStorage();

    expect(threads.length).toBe(2);
    expect(threads[0].title).toBe('Thread 1');
    // Check that images property is added during hydration
    expect(threads[0].images).toEqual([]);
    expect(renderThreadList).toHaveBeenCalled();
    expect(renderConversation).toHaveBeenCalled();
  });

  it('should delete unsaved threads older than 30 days', () => {
    const thirtyOneDaysAgo = Date.now() - (31 * 24 * 60 * 60 * 1000);
    threads = [
      { id: '1', title: 'Old unsaved thread', createdAt: thirtyOneDaysAgo, saved: false, conversationHistory: [] },
      { id: '2', title: 'New unsaved thread', createdAt: Date.now(), saved: false, conversationHistory: [] }
    ];

    cleanupExpiredThreads();

    expect(threads.length).toBe(1);
    expect(threads[0].id).toBe('2');
  });

  it('should not delete saved threads older than 30 days', () => {
    const thirtyOneDaysAgo = Date.now() - (31 * 24 * 60 * 60 * 1000);
    threads = [
      { id: '1', title: 'Old saved thread', createdAt: thirtyOneDaysAgo, saved: true, conversationHistory: [] }
    ];

    cleanupExpiredThreads();

    expect(threads.length).toBe(1);
    expect(threads[0].id).toBe('1');
  });

  it('should not delete any threads if they are all newer than 30 days', () => {
    const twentyNineDaysAgo = Date.now() - (29 * 24 * 60 * 60 * 1000);
    threads = [
      { id: '1', title: 'New unsaved thread', createdAt: twentyNineDaysAgo, saved: false, conversationHistory: [] },
      { id: '2', title: 'New saved thread', createdAt: twentyNineDaysAgo, saved: true, conversationHistory: [] }
    ];

    cleanupExpiredThreads();

    expect(threads.length).toBe(2);
  });

});
