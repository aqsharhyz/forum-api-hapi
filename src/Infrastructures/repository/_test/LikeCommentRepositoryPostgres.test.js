const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const LikeCommentTableTestHelper = require("../../../../tests/LikeCommentTableTestHelper");
const pool = require("../../database/postgres/pool");
const LikeCommentRepositoryPostgres = require("../LikeCommentRepositoryPostgres");
const LikeCommentRepository = require("../../../Domains/like_comment/LikeCommentRepository");

describe("a LikeCommentRepositoryPostgres", () => {
  beforeAll(async () => {
    await UsersTableTestHelper.addUser({
      id: "user-123",
      username: "testuser",
    });
    await ThreadsTableTestHelper.addThread({
      id: "thread-123",
      owner: "user-123",
    });
    await CommentsTableTestHelper.addComment({
      id: "comment-123",
      owner: "user-123",
      threadId: "thread-123",
    });
  });

  afterEach(async () => {
    await LikeCommentTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  it("should be instance of LikeCommentRepository domain", () => {
    const likeCommentRepositoryPostgres = new LikeCommentRepositoryPostgres(
      {},
      {}
    );

    expect(likeCommentRepositoryPostgres).toBeInstanceOf(LikeCommentRepository);
  });

  describe("checkLikeComment function", () => {
    it("should return false if like comment not found in database", async () => {
      // Arrange
      const likeCommentRepositoryPostgres = new LikeCommentRepositoryPostgres(
        pool,
        {}
      );

      // Action
      const likeComment = await likeCommentRepositoryPostgres.checkLikeComment(
        "comment-123",
        "user-123"
      );

      // Assert
      expect(likeComment).toBeFalsy();
    });

    it("should return true if like comment found in database", async () => {
      // Arrange
      await LikeCommentTableTestHelper.addLikeComment({
        id: "like-comment-123",
        commentId: "comment-123",
        owner: "user-123",
      });

      const likeCommentRepositoryPostgres = new LikeCommentRepositoryPostgres(
        pool,
        {}
      );

      // Action
      const likeComment = await likeCommentRepositoryPostgres.checkLikeComment(
        "comment-123",
        "user-123"
      );

      // Assert
      expect(likeComment).toBeTruthy();
    });
  });

  describe("likeComment function", () => {
    it("should persist new like comment in database", async () => {
      // Arrange
      const payload = {
        commentId: "comment-123",
        owner: "user-123",
      };
      const fakeIdGenerator = () => "123";
      const likeCommentRepositoryPostgres = new LikeCommentRepositoryPostgres(
        pool,
        fakeIdGenerator
      );

      // Action
      await likeCommentRepositoryPostgres.likeComment(
        payload.commentId,
        payload.owner
      );
      const likeComments = await LikeCommentTableTestHelper.getLikeCommentById(
        "like-comment-123"
      );

      // Assert
      expect(likeComments).toHaveLength(1);
      expect(likeComments).toStrictEqual([
        {
          id: "like-comment-123",
          comment_id: "comment-123",
          owner: "user-123",
        },
      ]);
    });
  });

  describe("unlikeComment function", () => {
    it("should delete like comment from database", async () => {
      // Arrange
      await LikeCommentTableTestHelper.addLikeComment({
        id: "like-123",
        commentId: "comment-123",
        owner: "user-123",
      });
      const likeCommentRepositoryPostgres = new LikeCommentRepositoryPostgres(
        pool,
        {}
      );

      // Action
      await likeCommentRepositoryPostgres.unlikeComment(
        "comment-123",
        "user-123"
      );

      // Assert
      const likeComments = await LikeCommentTableTestHelper.getLikeCommentById(
        "like-123"
      );
      expect(likeComments).toHaveLength(0);
    });
  });
});
