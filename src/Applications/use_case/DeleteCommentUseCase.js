class DeleteCommentUse {
  constructor({ commentRepository }) {
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);
    const { threadId, commentId, owner } = useCasePayload;
    await this._commentRepository.isCommentExistInThread(commentId, threadId);
    await this._commentRepository.verifyCommentOwner(commentId, owner);
    await this._commentRepository.deleteCommentById(commentId);
  }

  _verifyPayload({ threadId, commentId, owner }) {
    if (!threadId || !commentId || !owner) {
      throw new Error('DELETE_COMMENT_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof threadId !== 'string'
      || typeof commentId !== 'string'
      || typeof owner !== 'string'
    ) {
      throw new Error(
        'DELETE_COMMENT_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }
  }
}

module.exports = DeleteCommentUse;
