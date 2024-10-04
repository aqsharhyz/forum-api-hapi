const AddedThread = require('../../../Domains/threads/entities/AddedThread');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const ThreadRepositoryPostgres = require('../ThreadRepositoryPostgres');
const pool = require('../../database/postgres/pool');
const AddThread = require('../../../Domains/threads/entities/AddThread');

describe('a ThreadRepositoryPostgres', () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      id: 'user-123',
    });
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  it('should be instance of ThreadRepository domain', () => {
    const threadRepositoryPostgres = new ThreadRepositoryPostgres({}, {});

    expect(threadRepositoryPostgres).toBeInstanceOf(ThreadRepository);
  });

  describe('addThread function', () => {
    it('should persist new thread and return added thread correctly', async () => {
      // Arrange
      const newThread = new AddThread({
        title: 'test thread',
        body: 'this is body of thread',
        owner: 'user-123',
      });

      const fakeIdGenerator = () => '321';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      const threads = await ThreadsTableTestHelper.getThreadById('thread-321');
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-321',
          title: 'test thread',
          body: 'this is body of thread',
          owner: 'user-123',
        }),
      );
      expect(threads).toHaveLength(1);
    });

    it('should return added thread correctly', async () => {
      // Arrange
      const newThreadPayload = {
        title: 'test thread',
        body: 'this is body of thread',
        owner: 'user-123',
      };
      const newThread = new AddThread(newThreadPayload);

      const fakeIdGenerator = () => '321';
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedThread = await threadRepositoryPostgres.addThread(newThread);

      // Assert
      expect(addedThread).toStrictEqual(
        new AddedThread({
          id: 'thread-321',
          title: 'test thread',
          body: 'this is body of thread',
          owner: 'user-123',
        }),
      );
    });
  });

  describe('getThreadById function', () => {
    it('should throw NotFoundError when thread not found', () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      return expect(
        threadRepositoryPostgres.getThreadById('thread-123'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should return thread correctly', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({
        id: 'thread-123',
      });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action
      const thread = await threadRepositoryPostgres.getThreadById('thread-123');

      // Assert
      expect(thread).toStrictEqual({
        id: 'thread-123',
        title: 'Thread Title',
        body: 'Thread Body',
        date: expect.any(Date),
        username: 'dicoding',
      });
    });
  });

  describe('isThreadExist function', () => {
    it('should throw NotFoundError when thread not found', async () => {
      // Arrange
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.isThreadExist('thread-123'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when thread found', async () => {
      // Arrange
      await ThreadsTableTestHelper.addThread({ id: 'thread-123' });
      const threadRepositoryPostgres = new ThreadRepositoryPostgres(pool, {});

      // Action & Assert
      await expect(
        threadRepositoryPostgres.isThreadExist('thread-123'),
      ).resolves.not.toThrowError(NotFoundError);
    });
  });
});
