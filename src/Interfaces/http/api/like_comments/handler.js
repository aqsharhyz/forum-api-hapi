const ToggleLikeCommentUseCase = require("../../../../Applications/use_case/ToggleLikeCommentUseCase");

class LikeCommentHandler {
  constructor(container) {
    this._container = container;

    this.putLikeCommentHandler = this.putLikeCommentHandler.bind(this);
  }

  async putLikeCommentHandler(request) {
    const owner = request.auth.credentials.id;
    const { commentId, threadId } = request.params;
    const toggleLikeCommentUseCase = this._container.getInstance(
      ToggleLikeCommentUseCase.name
    );

    await toggleLikeCommentUseCase.execute({ commentId, owner, threadId });

    return {
      status: "success",
    };
  }
}

module.exports = LikeCommentHandler;
