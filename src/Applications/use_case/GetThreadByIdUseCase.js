class GetThreadByIdUseCase {
  constructor({
    threadRepository,
    commentRepository,
    replyRepository,
    likeCommentRepository,
  }) {
    this._threadRepository = threadRepository;
    this._commentRepository = commentRepository;
    this._replyRepository = replyRepository;
    this._likeCommentRepository = likeCommentRepository;
  }

  async execute(useCasePayload) {
    this._validatePayload(useCasePayload);
    const { threadId } = useCasePayload;
    await this._threadRepository.isThreadExist(threadId);
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(
      threadId
    );
    const commentsWithLikesCount = await Promise.all(
      comments.map(async (comment) => {
        const likeCount =
          await this._likeCommentRepository.getLikeCountByCommentId(comment.id);
        return {
          ...comment,
          likeCount,
        };
      })
    );

    const replies = await this._replyRepository.getRepliesByThreadId(threadId);

    const commentsWithReplies = this._mapCommentsWithReplies(
      commentsWithLikesCount,
      replies
    );

    const threadWithComments = {
      ...thread,
      comments: commentsWithReplies,
    };
    return threadWithComments;
  }

  _validatePayload(payload) {
    const { threadId } = payload;
    if (!threadId) {
      throw new Error("GET_THREAD_BY_ID_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY");
    }

    if (typeof threadId !== "string") {
      throw new Error(
        "GET_THREAD_BY_ID_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION"
      );
    }
  }

  _mapCommentsWithReplies(comments, replies) {
    return comments.map((comment) => ({
      id: comment.id,
      username: comment.username,
      date: comment.date,
      content: comment.is_delete
        ? "**komentar telah dihapus**"
        : comment.content,
      likeCount: comment.likeCount,
      replies: [...replies]
        .filter((reply) => reply.comment_id === comment.id)
        .map((reply) => ({
          id: reply.id,
          content: reply.is_delete
            ? "**balasan telah dihapus**"
            : reply.content,
          date: reply.date,
          username: reply.username,
        })),
    }));
  }
}

module.exports = GetThreadByIdUseCase;
