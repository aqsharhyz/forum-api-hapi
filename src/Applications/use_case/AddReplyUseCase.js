const AddReply = require('../../Domains/replies/entities/AddReply');
const AddedReply = require('../../Domains/replies/entities/AddedReply');

class AddReplyUseCase {
  constructor({ replyRepository, threadRepository, commentRepository }) {
    this._replyRepository = replyRepository;
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
  }

  async execute(useCasePayload) {
    const addReply = new AddReply(useCasePayload);
    await this._threadRepository.isThreadExist(addReply.threadId);
    await this._commentRepository.isCommentExistInThread(
      addReply.commentId,
      addReply.threadId,
    );
    const addedReply = await this._replyRepository.addReply(addReply);
    return new AddedReply(addedReply);
  }
}

module.exports = AddReplyUseCase;
