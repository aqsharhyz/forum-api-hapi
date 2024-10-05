const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const pool = require('../../database/postgres/pool');
const AddReply = require('../../../Domains/replies/entities/AddReply');
const AddedReply = require('../../../Domains/replies/entities/AddedReply');
const ReplyRepositoryPostgres = require('../ReplyRepositoryPostgres');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');
const NotFoundError = require('../../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../../Commons/exceptions/AuthorizationError');

describe('a ReplyRepositoryPostgres', () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      id: 'user-123',
      username: 'testuser',
    });
    await ThreadsTableTestHelper.addThread({
      id: 'thread-123',
      owner: 'user-123',
    });
    await CommentsTableTestHelper.addComment({
      id: 'comment-123',
      owner: 'user-123',
      threadId: 'thread-123',
    });
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  it('should be instance of ReplyRepository domain', () => {
    const replyRepositoryPostgres = new ReplyRepositoryPostgres({}, {});

    expect(replyRepositoryPostgres).toBeInstanceOf(ReplyRepository);
  });

  describe('addReply function', () => {
    it('should persist new reply in database', async () => {
      // Arrange
      const newReply = new AddReply({
        content: 'test reply',
        owner: 'user-123',
        threadId: 'thread-123',
        commentId: 'comment-123',
      });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(newReply);
      const replies = await RepliesTableTestHelper.getReplyById(addedReply.id);

      // Assert
      expect(replies).toHaveLength(1);
      expect(addedReply).toStrictEqual(
        new AddedReply({
          id: 'reply-123',
          content: newReply.content,
          owner: newReply.owner,
        }),
      );
    });

    it('should return added reply correctly', async () => {
      // Arrange
      const newReply = new AddReply({
        content: 'test reply',
        owner: 'user-123',
        threadId: 'thread-123',
        commentId: 'comment-123',
      });
      const fakeIdGenerator = () => '123';
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(
        pool,
        fakeIdGenerator,
      );

      // Action
      const addedReply = await replyRepositoryPostgres.addReply(newReply);

      // Assert
      expect(addedReply).toStrictEqual(
        new AddedReply({
          id: 'reply-123',
          content: newReply.content,
          owner: newReply.owner,
        }),
      );
    });
  });

  describe('isReplyExistInComment function', () => {
    it('should throw NotFoundError when reply is not exist', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(
        replyRepositoryPostgres.isReplyExistInComment(
          'reply-123',
          'comment-123',
        ),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should throw NotFoundError when reply not exist in comment', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-124',
        content: 'test reply',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(
        replyRepositoryPostgres.isReplyExistInComment(
          'reply-123',
          'comment-123',
        ),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should not throw NotFoundError when reply is exist', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        content: 'test reply',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(
        replyRepositoryPostgres.isReplyExistInComment(
          'reply-123',
          'comment-123',
        ),
      ).resolves.not.toThrowError(NotFoundError);
    });
  });

  describe('verifyReplyOwner function', () => {
    it('should throw AuthorizationError when reply owner is not valid', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        content: 'test reply',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(
        replyRepositoryPostgres.verifyReplyOwner('reply-123', 'user-124'),
      ).rejects.toThrowError(AuthorizationError);
    });

    it('should return true when reply owner is valid', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        content: 'test reply',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      });

      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const isReplyOwner = await replyRepositoryPostgres.verifyReplyOwner(
        'reply-123',
        'user-123',
      );

      expect(isReplyOwner).toBeTruthy();
    });
  });

  describe('getRepliesByCommentId function', () => {
    it('should return replies by comment id', async () => {
      const firstReply = {
        id: 'reply-123',
        content: 'test reply',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      };

      const secondReply = {
        id: 'reply-124',
        content: 'test reply 2',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
        is_delete: true,
      };

      await RepliesTableTestHelper.addReply(firstReply);
      await RepliesTableTestHelper.addReply(secondReply);
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByCommentId(
        'comment-123',
      );

      expect(replies).toHaveLength(2);
      expect(replies).toEqual([
        {
          id: firstReply.id, content: firstReply.content, is_delete: false, username: 'testuser', date: expect.any(Date),
        },
        {
          id: secondReply.id, content: secondReply.content, is_delete: secondReply.is_delete, username: 'testuser', date: expect.any(Date),
        },
      ]);
    });
  });

  describe('getRepliesByThreadId function', () => {
    it('should return replies by thread id', async () => {
      const firstReply = {
        id: 'reply-123',
        content: 'test reply',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      };

      const secondReply = {
        id: 'reply-124',
        content: 'test reply 2',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
        is_delete: true,
      };

      await RepliesTableTestHelper.addReply(firstReply);
      await RepliesTableTestHelper.addReply(secondReply);
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      const replies = await replyRepositoryPostgres.getRepliesByThreadId(
        'thread-123',
      );

      expect(replies).toHaveLength(2);
      expect(replies).toEqual([
        {
          id: firstReply.id, content: firstReply.content, is_delete: false, username: 'testuser', date: expect.any(Date), comment_id: firstReply.commentId,
        },
        {
          id: secondReply.id, content: secondReply.content, is_delete: secondReply.is_delete, username: 'testuser', date: expect.any(Date), comment_id: secondReply.commentId,
        },
      ]);
    });
  });

  describe('deleteReplyById function', () => {
    it('should throw NotFoundError when reply is not exist', async () => {
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await expect(
        replyRepositoryPostgres.deleteReplyById('reply-123'),
      ).rejects.toThrowError(NotFoundError);
    });

    it('should delete reply by id', async () => {
      await RepliesTableTestHelper.addReply({
        id: 'reply-123',
        content: 'test reply',
        owner: 'user-123',
        commentId: 'comment-123',
        threadId: 'thread-123',
      });
      const replyRepositoryPostgres = new ReplyRepositoryPostgres(pool, {});

      await replyRepositoryPostgres.deleteReplyById('reply-123');

      const replies = await RepliesTableTestHelper.getReplyById('reply-123');

      expect(replies[0].is_delete).toEqual(true);
    });
  });
});
