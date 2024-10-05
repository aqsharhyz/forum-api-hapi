const GetThreadByIdUseCase = require('../GetThreadByIdUseCase');
const ThreadRepository = require('../../../Domains/threads/ThreadRepository');
const CommentRepository = require('../../../Domains/comments/CommentRepository');
const ReplyRepository = require('../../../Domains/replies/ReplyRepository');

describe('a GetThreadByIdUseCase', () => {
  it('should throw error if payload not contain needed property', async () => {
    // Arrange
    const useCasePayload = {};

    const getThreadByIdUseCase = new GetThreadByIdUseCase({
      threadRepository: {},
      commentRepository: {},
    });

    // Action & Assert
    await expect(
      getThreadByIdUseCase.execute(useCasePayload),
    ).rejects.toThrowError(
      'GET_THREAD_BY_ID_USE_CASE.NOT_CONTAIN_NEEDED_PROPERTY',
    );
  });

  it('should throw error if payload not meet data type specification', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 123,
    };

    const getThreadByIdUseCase = new GetThreadByIdUseCase({
      threadRepository: {},
      commentRepository: {},
    });

    // Action & Assert
    await expect(
      getThreadByIdUseCase.execute(useCasePayload),
    ).rejects.toThrowError(
      'GET_THREAD_BY_ID_USE_CASE.PAYLOAD_NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should map comments with replies correctly', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-123',
        username: 'fulan',
        date: '2022-12-30T07:26:17.000Z',
        content: 'this is comment content',
        is_delete: false,
      },
      {
        id: 'comment-124',
        username: 'fulan',
        date: '2022-12-30T07:26:17.000Z',
        content: 'this is deleted comment content',
        is_delete: true,
      },
    ];

    const replies = [
      {
        id: 'reply-123',
        content: 'this is reply content',
        date: '2022-12-30T07:26:17.000Z',
        username: 'fulan',
        comment_id: 'comment-123',
        is_delete: false,
      },
    ];

    const expectedCommentsAndReplies = [
      {
        id: 'comment-123',
        username: 'fulan',
        date: '2022-12-30T07:26:17.000Z',
        content: 'this is comment content',
        replies: [
          {
            id: 'reply-123',
            content: 'this is reply content',
            date: '2022-12-30T07:26:17.000Z',
            username: 'fulan',
          },
        ],
      },
      {
        id: 'comment-124',
        username: 'fulan',
        date: '2022-12-30T07:26:17.000Z',
        content: '**komentar telah dihapus**',
        replies: [],
      },
    ];

    const getThreadByIdUseCase = new GetThreadByIdUseCase({
      threadRepository: {},
      commentRepository: {},
      replyRepository: {},
    });

    // Act
    const commentsWithReplies = getThreadByIdUseCase._mapCommentsWithReplies(
      comments,
      replies,
    );

    // Assert
    expect(commentsWithReplies).toStrictEqual(expectedCommentsAndReplies);
  });

  it('should map comments with replies correctly when there are deleted replies or comments', async () => {
    // Arrange
    const comments = [
      {
        id: 'comment-1',
        username: 'user1',
        date: '2023-10-01T12:00:00Z',
        content: 'First comment',
        is_delete: false,
      },
      {
        id: 'comment-2',
        username: 'user2',
        date: '2023-10-01T12:05:00Z',
        content: 'Second comment',
        is_delete: true,
      },
    ];

    const replies = [
      {
        id: 'reply-1',
        comment_id: 'comment-1',
        content: 'First reply',
        is_delete: false,
        date: '2023-10-01T12:01:00Z',
        username: 'user3',
      },
      {
        id: 'reply-2',
        comment_id: 'comment-1',
        content: 'Second reply',
        is_delete: true,
        date: '2023-10-01T12:02:00Z',
        username: 'user4',
      },
      {
        id: 'reply-3',
        comment_id: 'comment-2',
        content: 'Third reply',
        is_delete: false,
        date: '2023-10-01T12:06:00Z',
        username: 'user5',
      },
    ];

    const getThreadByIdUseCase = new GetThreadByIdUseCase({
      threadRepository: {},
      commentRepository: {},
      replyRepository: {},
    });

    // Act
    const result = getThreadByIdUseCase._mapCommentsWithReplies(
      comments,
      replies,
    );

    // Assert
    expect(result).toEqual([
      {
        id: 'comment-1',
        username: 'user1',
        date: '2023-10-01T12:00:00Z',
        content: 'First comment',
        replies: [
          {
            id: 'reply-1',
            content: 'First reply',
            date: '2023-10-01T12:01:00Z',
            username: 'user3',
          },
          {
            id: 'reply-2',
            content: '**balasan telah dihapus**',
            date: '2023-10-01T12:02:00Z',
            username: 'user4',
          },
        ],
      },
      {
        id: 'comment-2',
        username: 'user2',
        date: '2023-10-01T12:05:00Z',
        content: '**komentar telah dihapus**',
        replies: [
          {
            id: 'reply-3',
            content: 'Third reply',
            date: '2023-10-01T12:06:00Z',
            username: 'user5',
          },
        ],
      },
    ]);
  });

  it('should orchestrating the get thread by id action correctly', async () => {
    // Arrange
    const useCasePayload = {
      threadId: 'thread-123',
    };

    const expectedThread = {
      id: useCasePayload.threadId,
      title: 'test thread',
      body: 'this is body of thread',
      date: '2022-12-30T07:26:17.000Z',
      username: 'fulan',
    };

    const mockThreadRepository = new ThreadRepository();
    const mockCommentRepository = new CommentRepository();
    const mockReplyRepository = new ReplyRepository();

    mockThreadRepository.isThreadExist = jest.fn(() => Promise.resolve());
    mockThreadRepository.getThreadById = jest.fn(() => Promise.resolve({
      id: 'thread-123',
      title: 'test thread',
      body: 'this is body of thread',
      date: '2022-12-30T07:26:17.000Z',
      username: 'fulan',
    }));
    mockCommentRepository.getCommentsByThreadId = jest.fn(() => Promise.resolve([
      {
        id: 'comment-123',
        username: 'fulan',
        date: '2022-12-30T07:26:17.000Z',
        content: 'this is comment content',
        is_delete: false,
      },
      {
        id: 'comment-124',
        username: 'fulan',
        date: '2022-12-30T07:26:17.000Z',
        content: 'this is deleted comment content',
        is_delete: true,
      },
    ]));
    mockReplyRepository.getRepliesByThreadId = jest.fn(() => Promise.resolve([
      {
        id: 'reply-123',
        content: 'this is reply content',
        date: '2022-12-30T07:26:17.000Z',
        username: 'fulan',
        comment_id: 'comment-123',
        is_delete: false,
      },
    ]));

    const getThreadByIdUseCase = new GetThreadByIdUseCase({
      threadRepository: mockThreadRepository,
      commentRepository: mockCommentRepository,
      replyRepository: mockReplyRepository,
    });

    // Action
    const thread = await getThreadByIdUseCase.execute(useCasePayload);

    // Assert
    expect(thread).toStrictEqual({
      ...expectedThread,
      comments: [
        {
          id: 'comment-123',
          username: 'fulan',
          date: '2022-12-30T07:26:17.000Z',
          content: 'this is comment content',
          replies: [
            {
              id: 'reply-123',
              content: 'this is reply content',
              date: '2022-12-30T07:26:17.000Z',
              username: 'fulan',
            },
          ],
        },
        {
          id: 'comment-124',
          username: 'fulan',
          date: '2022-12-30T07:26:17.000Z',
          content: '**komentar telah dihapus**',
          replies: [],
        },
      ],
    });
    expect(mockThreadRepository.isThreadExist).toBeCalledWith(
      useCasePayload.threadId,
    );
    expect(mockThreadRepository.getThreadById).toBeCalledWith(
      useCasePayload.threadId,
    );
    expect(mockCommentRepository.getCommentsByThreadId).toBeCalledWith(
      useCasePayload.threadId,
    );
    expect(mockReplyRepository.getRepliesByThreadId).toBeCalledWith(
      useCasePayload.threadId,
    );
  });
});
