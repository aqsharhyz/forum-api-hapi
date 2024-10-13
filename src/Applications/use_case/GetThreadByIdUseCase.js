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
    const { threadId } = useCasePayload;
    await this._threadRepository.isThreadExist(threadId);
    const thread = await this._threadRepository.getThreadById(threadId);
    const comments = await this._commentRepository.getCommentsByThreadId(
      threadId,
    );
    const commentsWithLikesCount = await Promise.all(
      comments.map(async (comment) => {
        const likeCount = await this._likeCommentRepository.getLikeCountByCommentId(comment.id);
        return {
          id: comment.id,
          username: comment.username,
          date: comment.date,
          likeCount,
          content: comment.is_delete
            ? '**komentar telah dihapus**'
            : comment.content,
        };
      }),
    );

    const commentsWithReplies = await Promise.all(
      commentsWithLikesCount.map(async (comment) => {
        const replies = await this._replyRepository.getRepliesByCommentId(
          comment.id,
        );
        return {
          ...comment,
          replies: replies.map((reply) => ({
            id: reply.id,
            content: reply.is_delete
              ? '**balasan telah dihapus**'
              : reply.content,
            date: reply.date,
            username: reply.username,
          })),
        };
      }),
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
      throw new Error('GET_THREAD_BY_ID_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY');
    }

    if (typeof threadId !== 'string') {
      throw new Error(
        'GET_THREAD_BY_ID_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
      );
    }
  }
}

module.exports = GetThreadByIdUseCase;
