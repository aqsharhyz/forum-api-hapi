const pool = require('../../database/postgres/pool');
const container = require('../../container');
const createServer = require('../createServer');
const UsersTableTestHelper = require('../../../../tests/UsersTableTestHelper');
const ThreadsTableTestHelper = require('../../../../tests/ThreadsTableTestHelper');
const CommentsTableTestHelper = require('../../../../tests/CommentsTableTestHelper');
const RepliesTableTestHelper = require('../../../../tests/RepliesTableTestHelper');
const AuthenticationsTableTestHelper = require('../../../../tests/AuthenticationsTableTestHelper');

describe('/replies endpoint', () => {
  let accessToken;
  let threadId;
  let commentId;
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

    const commentPayload = {
      content: 'test comment',
    };
    const commentResponse = await server.inject({
      method: 'POST',
      url: `/threads/${threadId}/comments`,
      payload: commentPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    commentId = JSON.parse(commentResponse.payload).data.addedComment.id;
  });

  afterEach(async () => {
    await RepliesTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe('when POST /threads/{threadId}/comments/{commentId}/replies', () => {
    it('should response 201 and new reply', async () => {
      // Arrange
      const requestPayload = {
        content: 'test reply',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual('success');
      expect(responseJson.data.addedReply).toBeDefined();
    });

    it('should response 400 when request payload not contain needed property', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {},
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 404 when thread id not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'test reply',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/invalid-thread/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 404 when comment id not found', async () => {
      // Arrange
      const requestPayload = {
        content: 'test reply',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/invalid-comment/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 401 when unauthorized user add reply', async () => {
      // Arrange
      const requestPayload = {
        content: 'test reply',
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toBeDefined();
    });
  });

  describe('when DELETE /threads/{threadId}/comments/{commentId}/replies/{replyId}', () => {
    it('should response 200 when reply deleted', async () => {
      // Arrange
      const requestPayload = {
        content: 'test reply',
      };
      const server = await createServer(container);

      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const replyId = JSON.parse(replyResponse.payload).data.addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual('success');
    });

    it('should response 404 when reply not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/1`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 404 when thread not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/1/comments/${commentId}/replies/1`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 404 when comment not found', async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/1/replies/1`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 403 when user not owner of reply', async () => {
      // Arrange
      const server = await createServer(container);
      const otherUserResponse = await server.inject({
        method: 'POST',
        url: '/users',
        payload: {
          username: 'otheruser',
          password: 'secret',
          fullname: 'other user',
        },
      });
      const otherUserId = JSON.parse(otherUserResponse.payload).data.addedUser
        .id;

      const loginResponse = await server.inject({
        method: 'POST',
        url: '/authentications',
        payload: {
          username: 'otheruser',
          password: 'secret',
        },
      });
      const otherAccessToken = JSON.parse(loginResponse.payload).data
        .accessToken;

      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: {
          content: 'test reply',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const replyId = JSON.parse(replyResponse.payload).data.addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
        headers: {
          Authorization: `Bearer ${otherAccessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(403);
      expect(responseJson.status).toEqual('fail');
      expect(responseJson.message).toBeDefined();
    });

    it('should response 401 when unauthorized user delete reply', async () => {
      // Arrange
      const requestPayload = {
        content: 'test reply',
      };
      const server = await createServer(container);

      const replyResponse = await server.inject({
        method: 'POST',
        url: `/threads/${threadId}/comments/${commentId}/replies`,
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const replyId = JSON.parse(replyResponse.payload).data.addedReply.id;

      // Action
      const response = await server.inject({
        method: 'DELETE',
        url: `/threads/${threadId}/comments/${commentId}/replies/${replyId}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual('Unauthorized');
      expect(responseJson.message).toBeDefined();
    });
  });
});
