const AddReply = require('../AddReply');

describe('AddReply entity', () => {
  it('should throw error when payload did not contain needed property', () => {
    const payload = {
      content: 'a reply',
      owner: 'user-123',
    };

    expect(() => new AddReply(payload)).toThrowError(
      'ADD_REPLY.NOT_CONTAIN_NEEDED_PROPERTY',
    );
  });

  it('should throw error when payload did not meet data type specification', () => {
    const payload = {
      content: 123,
      owner: 'user-123',
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    expect(() => new AddReply(payload)).toThrowError(
      'ADD_REPLY.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should create AddReply object correctly', () => {
    const payload = {
      content: 'a reply',
      owner: 'user-123',
      threadId: 'thread-123',
      commentId: 'comment-123',
    };

    const addReply = new AddReply(payload);

    expect(addReply.content).toEqual(payload.content);
    expect(addReply.owner).toEqual(payload.owner);
    expect(addReply.threadId).toEqual(payload.threadId);
    expect(addReply.commentId).toEqual(payload.commentId);
  });
});
