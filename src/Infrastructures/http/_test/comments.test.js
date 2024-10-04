const pool = require('../../database/postgres/pool');
const container = require('../../container');
const createServer = require('../createServer');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');

describe('/comments endpoint', () => {
  let accessToken;
  let threadId;
  let userId;

  beforeAll(async () => {
    const server = await createServer(container);

    const userResult = await server.inject({
      method: 'POST',
      url: '/users',
      payload: {
        username: 'test',
        password: 'secret',
        fullname: 'test user',
      },
    });
    userId = JSON.parse(userResult.payload).data.addedUser.id;

    const loginResponse = await server.inject({
      method: 'POST',
      url: '/authentications',
      payload: {
        username: 'test',
        password: 'secret',
      },
    });
    accessToken = JSON.parse(loginResponse.payload).data.accessToken;

    const threadPayload = {
      title: 'test thread',
      body: 'this is body of thread',
    };
    const threadResponse = await server.inject({
      method: 'POST',
      url: '/threads',
      payload: threadPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    threadId = JSON.parse(threadResponse.payload).data.addedThread.id;
  });

  afterEach(async () => {
    await CommentsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('when POST /threads/{threadId}/comments', () => {
    it('should response 201 and persisted comment', async () => {
      // Arrange
      const requestPayload = {
        content: 'test comment',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedComment).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {},
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual(
        'tidak dapat membuat comment baru karena properti yang dibutuhkan tidak ada',
      );
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'test comment',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: '/threads/1/comments',
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual('thread tidak ditemukan');
    });

    it('should response 401 when request not contain access token', async () => {
      // Arrange
      const requestPayload = {
        content: 'test comment',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}', () => {
    it('should response 200 and delete comment', async () => {
      // Arrange
      const requestPayload = {
        content: 'test comment',
      };
      const server = await createServer(container);

      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentId = JSON.parse(commentResponse.payload).data.addedComment
        .id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should response 401 when request not contain access token', async () => {
      // Arrange
      const requestPayload = {
        content: 'test comment',
      };
      const server = await createServer(container);

      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentId = JSON.parse(commentResponse.payload).data.addedComment
        .id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toEqual('Missing authentication');
    });

    it('should response 404 when comment not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/1`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual(
        'comment atau thread tidak ditemukan',
      );
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: '/threads/1/comments/1',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual(
        'comment atau thread tidak ditemukan',
      );
    });

    it('should response 403 when user not owner of comment', async () => {
      // Arrange
      const server = await createServer(container);

      const userResult = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'test2',
          password: 'secret',
          fullname: 'test user2',
        },
      });
      const userId2 = JSON.parse(userResult.payload).data.addedUser.id;

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'test2',
          password: 'secret',
        },
      });
      const accessToken2 = JSON.parse(loginResponse.payload).data.accessToken;

      const commentResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments`,
        payload: {
          content: 'test comment',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const commentId = JSON.parse(commentResponse.payload).data.addedComment
        .id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}`,
        headers: {
          Authorization: `Bearer ${accessToken2}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toEqual(
        'Anda tidak berhak mengakses resource ini',
      );
    });
  });
});
