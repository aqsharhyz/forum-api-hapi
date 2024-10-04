const AddComment = require('../AddComment');

describe('a AddComment entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      content: 'Test',
    };

    // Action & Assert
    expect(() => new AddComment(payload)).toThrowError(
      'ADD_COMMENT.NOT_CONTAIN_NEEDED_PROPERTY',
    );
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      content: 123,
      owner: {},
      threadId: [],
    };

    // Action & Assert
    expect(() => new AddComment(payload)).toThrowError(
      'ADD_COMMENT.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should create addComment object correctly', () => {
    // Arrange
    const payload = {
      content: 'Test',
      owner: 'user-123',
      threadId: 'thread-123',
    };

    // Action
    const addComment = new AddComment(payload);

    // Assert
    expect(addComment.content).toEqual(payload.content);
    expect(addComment.owner).toEqual(payload.owner);
    expect(addComment.threadId).toEqual(payload.threadId);
  });
});
