const ToggleLikeCommentUseCase = require("../ToggleLikeCommentUseCase");
const CommentRepository = require("../../../Domains/comments/CommentRepository");
const LikeCommentRepository = require("../../../Domains/like_comment/LikeCommentRepository");

describe("ToggleLikeCommentUseCase", () => {
  it("should throw error if use case payload not contain needed property", async () => {
    // Arrange
    const useCasePayload = {
      owner: "user-123",
    };
    const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase({});

    // Action & Assert
    await expect(
      toggleLikeCommentUseCase.execute(useCasePayload)
    ).rejects.toThrowError(
      "TOGGLE_LIKE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY"
    );
  });

  it("should throw error if use case payload not meet data type specification", async () => {
    // Arrange
    const useCasePayload = {
      commentId: 123,
      threadId: 123,
      owner: {},
    };
    const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase({});

    // Action & Assert
    await expect(
      toggleLikeCommentUseCase.execute(useCasePayload)
    ).rejects.toThrowError(
      "TOGGLE_LIKE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION"
    );
  });

  describe("should orchestrating the toggle like comment action correctly", () => {
    it("should add like to comment", async () => {
      // Arrange
      const useCasePayload = {
        commentId: "comment-123",
        threadId: "thread-123",
        owner: "user-123",
      };

      const mockCommentRepository = new CommentRepository();
      const mockLikeCommentRepository = new LikeCommentRepository();
      mockCommentRepository.isCommentExistInThread = jest.fn(() =>
        Promise.resolve()
      );
      mockLikeCommentRepository.checkLikeComment = jest.fn(() =>
        Promise.resolve(false)
      );
      mockLikeCommentRepository.likeComment = jest.fn(() => Promise.resolve());
      mockLikeCommentRepository.unlikeComment = jest.fn(() =>
        Promise.resolve()
      );

      const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase({
        commentRepository: mockCommentRepository,
        likeCommentRepository: mockLikeCommentRepository,
      });

      // Action
      await toggleLikeCommentUseCase.execute(useCasePayload);

      // Assert
      expect(mockCommentRepository.isCommentExistInThread).toHaveBeenCalledWith(
        useCasePayload.commentId,
        useCasePayload.threadId
      );
      expect(mockLikeCommentRepository.checkLikeComment).toHaveBeenCalledWith(
        useCasePayload.commentId,
        useCasePayload.owner
      );
      expect(mockLikeCommentRepository.likeComment).toHaveBeenCalledWith(
        useCasePayload.commentId,
        useCasePayload.owner
      );
      expect(mockLikeCommentRepository.unlikeComment).not.toHaveBeenCalled();
    });

    it("should remove like from comment", async () => {
      // Arrange
      const useCasePayload = {
        commentId: "comment-123",
        threadId: "thread-123",
        owner: "user-123",
      };

      const mockCommentRepository = new CommentRepository();
      const mockLikeCommentRepository = new LikeCommentRepository();
      mockCommentRepository.isCommentExistInThread = jest.fn(() =>
        Promise.resolve()
      );
      mockLikeCommentRepository.checkLikeComment = jest.fn(() =>
        Promise.resolve(true)
      );
      mockLikeCommentRepository.unlikeComment = jest.fn(() =>
        Promise.resolve()
      );
      mockLikeCommentRepository.likeComment = jest.fn(() => Promise.resolve());

      const toggleLikeCommentUseCase = new ToggleLikeCommentUseCase({
        commentRepository: mockCommentRepository,
        likeCommentRepository: mockLikeCommentRepository,
      });

      // Action
      await toggleLikeCommentUseCase.execute(useCasePayload);

      // Assert
      expect(mockCommentRepository.isCommentExistInThread).toHaveBeenCalledWith(
        useCasePayload.commentId,
        useCasePayload.threadId
      );
      expect(mockLikeCommentRepository.checkLikeComment).toHaveBeenCalledWith(
        useCasePayload.commentId,
        useCasePayload.owner
      );
      expect(mockLikeCommentRepository.unlikeComment).toHaveBeenCalledWith(
        useCasePayload.commentId,
        useCasePayload.owner
      );
      expect(mockLikeCommentRepository.likeComment).not.toHaveBeenCalled();
    });
  });
});
