const LikeCommentRepository = require('../LikeCommentRepository');

describe('LikeCommentRepository', () => {
  it('should throw error when invoke abstract behavior', async () => {
    // Arrange
    const likeCommentRepository = new LikeCommentRepository();

    // Action & Assert
    await expect(
      likeCommentRepository.checkLikeComment('', ''),
    ).rejects.toThrowError('LIKE_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(
      likeCommentRepository.likeComment('', ''),
    ).rejects.toThrowError('LIKE_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(
      likeCommentRepository.unlikeComment('', ''),
    ).rejects.toThrowError('LIKE_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
    await expect(
      likeCommentRepository.getLikeCountByCommentId(''),
    ).rejects.toThrowError('LIKE_COMMENT_REPOSITORY.METHOD_NOT_IMPLEMENTED');
  });
});
