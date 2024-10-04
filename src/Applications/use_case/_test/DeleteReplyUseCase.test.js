const DeleteReplyUseCase = require('../DeleteReplyUseCase');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');

describe('DeleteReplyUseCase', () => {
  it('should orchestrate the delete reply action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
      commentId: 'comment-123',
      replyId: 'reply-123',
      owner: 'user-123',
    };

    const mockReplyRepository = new ReplyRepository();

    mockReplyRepository.isReplyExistInComment = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.verifyReplyOwner = jest
      .fn()
      .mockImplementation(() => Promise.resolve());
    mockReplyRepository.deleteReplyById = jest
      .fn()
      .mockImplementation(() => Promise.resolve());

    const deleteReplyUseCase = new DeleteReplyUseCase({
      replyRepository: mockReplyRepository,
    });

    // Act
    await deleteReplyUseCase.execute(useCasePayload);

    // Assert
    expect(mockReplyRepository.isReplyExistInComment).toHaveBeenCalledWith(
      useCasePayload.replyId,
      useCasePayload.commentId,
    );
    expect(mockReplyRepository.verifyReplyOwner).toHaveBeenCalledWith(
      useCasePayload.replyId,
      useCasePayload.owner,
    );
    expect(mockReplyRepository.deleteReplyById).toHaveBeenCalledWith(
      useCasePayload.replyId,
    );
  });

  it('should throw error if the use case payload not contain needed property', async () => {
    // Arrange
    const useCasePayload = {};

    const deleteReplyUseCase = new DeleteReplyUseCase({});

    // Action & Assert
    await expect(
      deleteReplyUseCase.execute(useCasePayload),
    ).rejects.toThrowError('DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
  });

  it('should throw error if the use case payload not meet data type specification', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 123,
      commentId: 123,
      replyId: 123,
      owner: 123,
    };

    const deleteReplyUseCase = new DeleteReplyUseCase({});

    // Action & Assert
    await expect(
      deleteReplyUseCase.execute(useCasePayload),
    ).rejects.toThrowError(
      'DELETE_REPLY_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });
});
