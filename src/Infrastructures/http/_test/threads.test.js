const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const RepliesTableTestHelper = require("../../../../tests/RepliesTableTestHelper");
const AuthenticationsTableTestHelper = require("../../../../tests/AuthenticationsTableTestHelper");
const pool = require("../../database/postgres/pool");
const container = require("../../container");
const createServer = require("../createServer");

describe("/threads endpoint", () => {
  let accessToken;

  beforeAll(async () => {
    const server = await createServer(container);

    await server.inject({
      method: "POST",
      url: "/users",
      payload: {
        username: "test",
        password: "secret",
        fullname: "test user",
      },
    });

    const loginResponse = await server.inject({
      method: "POST",
      url: "/authentications",
      payload: {
        username: "test",
        password: "secret",
      },
    });
    const loginResponseJson = JSON.parse(loginResponse.payload);
    accessToken = loginResponseJson.data.accessToken;
  });

  afterEach(async () => {
    await ThreadsTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe("when POST /threads", () => {
    it("should response 201 and persisted thread", async () => {
      // Arrange
      const requestPayload = {
        title: "test thread",
        body: "this is body of thread",
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(201);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.addedThread).toBeDefined();
    });

    it("should response 400 when request payload not contain needed property", async () => {
      // Arrange
      const requestPayload = {
        body: "this is body of thread",
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: requestPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(400);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual(
        "tidak dapat membuat thread baru karena properti yang dibutuhkan tidak ada"
      );
    });

    it("should response 401 when request not contain access token", async () => {
      // Arrange
      const requestPayload = {
        title: "test thread",
        body: "this is body of thread",
      };
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: "POST",
        url: "/threads",
        payload: requestPayload,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual("Unauthorized");
      expect(responseJson.message).toEqual("Missing authentication");
    });
  });

  describe("when GET /threads/{threadId}", () => {
    it("should response 200 and return thread", async () => {
      // Arrange
      const threadPayload = {
        title: "test thread",
        body: "this is body of thread",
        owner: "user-123",
      };
      const server = await createServer(container);
      const threadResponse = await server.inject({
        method: "POST",
        url: "/threads",
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const thread = JSON.parse(threadResponse.payload);

      // Action
      const response = await server.inject({
        method: "GET",
        url: `/threads/${thread.data.addedThread.id}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.thread).toEqual({
        id: thread.data.addedThread.id,
        title: threadPayload.title,
        body: threadPayload.body,
        date: expect.any(String),
        username: "test",
        comments: [],
      });
    });

    it("should response 200 and return thread with comments", async () => {
      // Arrange
      const threadPayload = {
        title: "test thread",
        body: "this is body of thread",
      };
      const server = await createServer(container);
      const threadResponse = await server.inject({
        method: "POST",
        url: "/threads",
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const thread = JSON.parse(threadResponse.payload);

      const commentPayload = {
        content: "test comment",
      };
      await server.inject({
        method: "POST",
        url: `/threads/${thread.data.addedThread.id}/comments`,
        payload: commentPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Action
      const response = await server.inject({
        method: "GET",
        url: `/threads/${thread.data.addedThread.id}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.thread).toEqual({
        id: thread.data.addedThread.id,
        title: threadPayload.title,
        body: threadPayload.body,
        date: expect.any(String),
        username: "test",
        comments: [
          {
            id: expect.any(String),
            content: commentPayload.content,
            username: "test",
            date: expect.any(String),
            likeCount: 0,
            replies: [],
          },
        ],
      });
    });

    it("should response 200 and return thread with comments and replies", async () => {
      // Arrange
      const threadPayload = {
        title: "test thread",
        body: "this is body of thread",
      };
      const server = await createServer(container);
      const threadResponse = await server.inject({
        method: "POST",
        url: "/threads",
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const thread = JSON.parse(threadResponse.payload);

      const commentPayload = {
        content: "test comment",
      };
      const commentResponse = await server.inject({
        method: "POST",
        url: `/threads/${thread.data.addedThread.id}/comments`,
        payload: commentPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const comment = JSON.parse(commentResponse.payload);

      const replyPayload = {
        content: "test reply",
      };
      await server.inject({
        method: "POST",
        url: `/threads/${thread.data.addedThread.id}/comments/${comment.data.addedComment.id}/replies`,
        payload: replyPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Action
      const response = await server.inject({
        method: "GET",
        url: `/threads/${thread.data.addedThread.id}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.thread).toEqual({
        id: thread.data.addedThread.id,
        title: threadPayload.title,
        body: threadPayload.body,
        date: expect.any(String),
        username: "test",
        comments: [
          {
            id: comment.data.addedComment.id,
            content: commentPayload.content,
            username: "test",
            date: expect.any(String),
            likeCount: 0,
            replies: [
              {
                id: expect.any(String),
                date: expect.any(String),
                content: replyPayload.content,
                username: "test",
              },
            ],
          },
        ],
      });
    });

    it("should response 200 and return thread with comments, replies, and comment likes", async () => {
      // Arrange
      const threadPayload = {
        title: "test thread",
        body: "this is body of thread",
      };
      const server = await createServer(container);
      const threadResponse = await server.inject({
        method: "POST",
        url: "/threads",
        payload: threadPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const thread = JSON.parse(threadResponse.payload);

      const commentPayload = {
        content: "test comment",
      };
      const commentResponse = await server.inject({
        method: "POST",
        url: `/threads/${thread.data.addedThread.id}/comments`,
        payload: commentPayload,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const comment = JSON.parse(commentResponse.payload);

      await server.inject({
        method: "PUT",
        url: `/threads/${thread.data.addedThread.id}/comments/${comment.data.addedComment.id}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Action
      const response = await server.inject({
        method: "GET",
        url: `/threads/${thread.data.addedThread.id}`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");
      expect(responseJson.data.thread).toEqual({
        id: thread.data.addedThread.id,
        title: threadPayload.title,
        body: threadPayload.body,
        date: expect.any(String),
        username: "test",
        comments: [
          {
            id: comment.data.addedComment.id,
            content: commentPayload.content,
            username: "test",
            date: expect.any(String),
            likeCount: 1,
            replies: [],
          },
        ],
      });
    });

    it("should response 404 when thread not found", async () => {
      // Arrange
      const server = await createServer(container);

      // Action
      const response = await server.inject({
        method: "GET",
        url: "/threads/thread-123",
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual("thread tidak ditemukan");
    });
  });
});
