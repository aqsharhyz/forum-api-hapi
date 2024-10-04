class DeleteReplyUseCase {
  constructor({ replyRepository }) {
    this._replyRepository = replyRepository;
  }

  async execute(useCasePayload) {
    this._verifyPayload(useCasePayload);
    const { replyId, commentId, owner } = useCasePayload;
    await this._replyRepository.isReplyExistInComment(replyId, commentId);
    await this._replyRepository.verifyReplyOwner(replyId, owner);
    await this._replyRepository.deleteReplyById(replyId);
  }

  _verifyPayload({ replyId, commentId, owner }) {
    if (!replyId || !commentId || !owner) {
      throw new Error('DELETE_REPLY_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (
      typeof replyId !== 'string'
      || typeof commentId !== 'string'
      || typeof owner !== 'string'
    ) {
      throw new Error('DELETE_REPLY_USE_CASE.NOT_MEET_DATA_TYPE_SPECIFICATION');
    }
  }
}

module.exports = DeleteReplyUseCase;
