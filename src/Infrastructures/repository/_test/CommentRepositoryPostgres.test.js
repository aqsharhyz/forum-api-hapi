const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const pool = require('../../database/postgres/pool');
const AddComment = require('../../../Domains/comments/entities/AddComment');
const AddedComment = require('../../../Domains/comments/entities/AddedComment');
const CommentRepositoryPostgres = require('../CommentRepositoryPostgres');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('a CommentRepositoryPostgres', () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'testuser',
    });
    await ThreadsTableTestHelper.addThread({
      id: 'thread-123',
      owner: 'user-123',
    });
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  it('should be instance of CommentRepository domain', () => {
    const commentRepositoryPostgres = new CommentRepositoryPostgres({}, {});

    expect(commentRepositoryPostgres).toBeInstanceOf(CommentRepository);
  });

  describe('addComment function', () => {
    //!
    it('should persist new comment in database', async () => {
      // Arrange
      const newComment = new AddComment({
        content: 'test comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(
        newComment,
      );
      const comments = await CommentsTableTestHelper.getCommentById(
        addedComment.id,
      );

      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: 'comment-123',
          content: newComment.content,
          owner: newComment.owner,
        }),
      );
      expect(comments).toHaveLength(1);
    });

    it('should return added comment correctly', async () => {
      // Arrange
      const newComment = new AddComment({
        content: 'test comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedComment = await commentRepositoryPostgres.addComment(
        newComment,
      );

      // Assert
      expect(addedComment).toStrictEqual(
        new AddedComment({
          id: 'comment-123',
          content: newComment.content,
          owner: newComment.owner,
        }),
      );
    });
  });

  describe('isCommentExistInThread function', () => {
    it('should throw NotFoundError when comment is not exist', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.isCommentExistInThread(
          'comment-123',
          'thread-123',
        ),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when comment not exist in thread', async () => {
      await CommentsTableTestHelper.addComment({
        id: 'comment-124',
        content: 'test comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.isCommentExistInThread(
          'comment-123',
          'thread-123',
        ),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when comment exist in thread', async () => {
      const newComment = new AddComment({
        content: 'test comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      await commentRepositoryPostgres.addComment(newComment);

      await expect(
        commentRepositoryPostgres.isCommentExistInThread(
          'comment-123',
          'thread-123',
        ),
      ).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyCommentOwner function', () => {
    it('should return true when comment owner is the same as the payload', async () => {
      const newComment = new AddComment({
        content: 'test comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      await commentRepositoryPostgres.addComment(newComment);

      const isCommentOwner = await commentRepositoryPostgres.verifyCommentOwner(
        'comment-123',
        'user-123',
      );

      expect(isCommentOwner).toBeTruthy();
    });

    it('should return Authorizationerror when comment owner is not the same as the payload', async () => {
      const newComment = new AddComment({
        content: 'test comment',
        owner: 'user-123',
        threadId: 'thread-123',
      });

      const fakeIdGenerator = () => '123';
      const commentRepositoryPostgres = new CommentRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      await commentRepositoryPostgres.addComment(newComment);

      await expect(
        commentRepositoryPostgres.verifyCommentOwner('comment-123', 'user-432'),
      ).rejects.toThrowError(AuthorizationError);
    });
  });

  describe('getCommentsByThreadId function', () => {
    it('should return all comments by thread id', async () => {
      const firstComment = {
        content: 'first comment',
        id: 'comment-123',
        is_delete: false,
      };

      const secondComment = {
        content: 'second comment',
        id: 'comment-124',
        is_delete: true,
      };

      await CommentsTableTestHelper.addComment(firstComment);
      await CommentsTableTestHelper.addComment(secondComment);
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId(
        'thread-123',
      );

      expect(comments).toHaveLength(2);
      comments.forEach((comment) => {
        expect(comment).toHaveProperty('id');
        expect(comment).toHaveProperty('content');
        expect(comment).toHaveProperty('date');
        expect(comment).toHaveProperty('username', 'testuser');
        expect(comment).toHaveProperty('is_delete');
      });
    });

    it('should return empty array when no comments exist for the thread', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      const comments = await commentRepositoryPostgres.getCommentsByThreadId(
        'thread-123',
      );

      expect(comments).toHaveLength(0);
      expect(comments).toStrictEqual([]);
    });
  });

  describe('deleteCommentById function', () => {
    it('should throw NotFoundError when comment is not exist', async () => {
      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await expect(
        commentRepositoryPostgres.deleteCommentById('comment-123'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should delete comment by id', async () => {
      const newComment = {
        id: 'comment-123',
        content: 'test comment',
        owner: 'user-123',
        threadId: 'thread-123',
      };

      await CommentsTableTestHelper.addComment(newComment);

      const commentRepositoryPostgres = new CommentRepositoryPostgres(pool, {});

      await commentRepositoryPostgres.deleteCommentById('comment-123');

      const comments = await CommentsTableTestHelper.getCommentById(
        'comment-123',
      );

      expect(comments[0].is_delete).toEqual(true);
    });
  });
});
