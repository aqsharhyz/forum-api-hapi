class ToggleLikeCommentUseCase {
  constructor({ commentRepository, likeCommentRepository }) {
    this._commentRepository = commentRepository;
    this._likeCommentRepository = likeCommentRepository;
  }

  async execute(useCasePayload) {
    this._validatePayload(useCasePayload);
    const { threadId, commentId, owner } = useCasePayload;
    await this._commentRepository.isCommentExistInThread(commentId, threadId);
    const isLiked = await this._likeCommentRepository.checkLikeComment(
      commentId,
      owner,
    );
    isLiked
      ? await this._likeCommentRepository.unlikeComment(commentId, owner)
      : await this._likeCommentRepository.likeComment(commentId, owner);
  }

  _validatePayload({ threadId, commentId, owner }) {
    if (!threadId || !commentId || !owner) {
      throw new Error(
        'TOGGLE_LIKE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY',
      );
    }

    if (
      typeof threadId !== 'string'
      || typeof commentId !== 'string'
      || typeof owner !== 'string'
    ) {
      throw new Error(
        'TOGGLE_LIKE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }
  }
}

module.exports = ToggleLikeCommentUseCase;
