const DetailThread = require('../DetailThread');

describe('a DetailThread entities', () => {
  it('should throw error when payload did not contain needed property', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
    };

    // Action and Assert
    expect(() => new DetailThread(payload)).toThrowError(
      'DETAIL_THREAD.NOT_CONTAIN_NEEDED_PROPERTY',
    );
  });

  it('should throw error when payload did not meet data type specification', () => {
    // Arrange
    const payload = {
      id: 123,
      title: 123,
      body: {},
      date: {},
      username: [],
    };

    // Action and Assert
    expect(() => new DetailThread(payload)).toThrowError(
      'DETAIL_THREAD.NOT_MEET_DATA_TYPE_SPECIFICATION',
    );
  });

  it('should create DetailThread object correctly', () => {
    // Arrange
    const payload = {
      id: 'thread-123',
      title: 'Test',
      body: 'Test Body',
      date: '2021-08-08T07:22:33Z',
      username: 'user-123',
    };

    // Action
    const detailThread = new DetailThread(payload);

    // Assert
    expect(detailThread.id).toEqual(payload.id);
    expect(detailThread.title).toEqual(payload.title);
    expect(detailThread.body).toEqual(payload.body);
    expect(detailThread.date).toEqual(payload.date);
    expect(detailThread.username).toEqual(payload.username);
  });
});
