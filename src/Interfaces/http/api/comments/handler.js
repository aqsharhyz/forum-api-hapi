const AddCommentUseCase = require('../../../../Applications/use_case/AddCommentUseCase');
const DeleteCommentUseCase = require('../../../../Applications/use_case/DeleteCommentUseCase');

class CommentsHandler {
  constructor(container) {
    this._container = container;

    this.postCommentHandler = this.postCommentHandler.bind(this);
    this.deleteCommentHandler = this.deleteCommentHandler.bind(this);
  }

  async postCommentHandler(request, h) {
    const owner = request.auth.credentials.id;
    const { threadId } = request.params;
    const { content } = request.payload;

    const addCommentUseCase = this._container.getInstance(
      AddCommentUseCase.name,
    );

    const addedComment = await addCommentUseCase.execute({
      threadId,
      content,
      owner,
    });

    const response = h.response({
      status: 'success',
      data: {
        addedComment,
      },
    });
    response.code(201);
    return response;
  }

  async deleteCommentHandler(request, h) {
    const owner = request.auth.credentials.id;
    const { threadId, commentId } = request.params;

    const deleteCommentUseCase = this._container.getInstance(
      DeleteCommentUseCase.name,
    );
    await deleteCommentUseCase.execute({ threadId, commentId, owner });

    return {
      status: 'success',
    };
  }
}

module.exports = CommentsHandler;
