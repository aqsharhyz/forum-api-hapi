const UsersTableTestHelper = require("../../../../tests/UsersTableTestHelper");
const AuthenticationsTableTestHelper = require("../../../../tests/AuthenticationsTableTestHelper");
const ThreadsTableTestHelper = require("../../../../tests/ThreadsTableTestHelper");
const CommentsTableTestHelper = require("../../../../tests/CommentsTableTestHelper");
const LikeCommentTableTestHelper = require("../../../../tests/LikeCommentTableTestHelper");
const pool = require("../../database/postgres/pool");
const container = require("../../container");
const createServer = require("../createServer");

describe("/likes endpoint", () => {
  let accessToken;
  let threadId;
  let userId;
  let commentId;

  beforeAll(async () => {
    const server = await createServer(container);

    const userResult = await server.inject({
      method: "POST",
      url: "/users",
      payload: {
        username: "test",
        password: "secret",
        fullname: "test user",
      },
    });
    userId = JSON.parse(userResult.payload).data.addedUser.id;

    const loginResponse = await server.inject({
      method: "POST",
      url: "/authentications",
      payload: {
        username: "test",
        password: "secret",
      },
    });
    accessToken = JSON.parse(loginResponse.payload).data.accessToken;

    const threadPayload = {
      title: "test thread",
      body: "this is body of thread",
    };
    const threadResponse = await server.inject({
      method: "POST",
      url: "/threads",
      payload: threadPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    threadId = JSON.parse(threadResponse.payload).data.addedThread.id;

    const commentPayload = {
      content: "test comment",
    };
    const commentResponse = await server.inject({
      method: "POST",
      url: `/threads/${threadId}/comments`,
      payload: commentPayload,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    commentId = JSON.parse(commentResponse.payload).data.addedComment.id;
  });

  afterEach(async () => {
    await LikeCommentTableTestHelper.cleanTable();
  });

  afterAll(async () => {
    await CommentsTableTestHelper.cleanTable();
    await ThreadsTableTestHelper.cleanTable();
    await AuthenticationsTableTestHelper.cleanTable();
    await UsersTableTestHelper.cleanTable();
    await pool.end();
  });

  describe("when PUT /threads/{threadId}/comments/{commentId}/likes", () => {
    it("should response 200 when authenticated and thread and comment found", async () => {
      // Action
      const server = await createServer(container);
      const response = await server.inject({
        method: "PUT",
        url: `/threads/${threadId}/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(200);
      expect(responseJson.status).toEqual("success");
    });

    it("should response 404 when thread not found", async () => {
      // Action
      const server = await createServer(container);
      const response = await server.inject({
        method: "PUT",
        url: `/threads/invalid-thread/comments/${commentId}/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual(
        "comment atau thread tidak ditemukan"
      );
    });

    it("should response 404 when comment not found", async () => {
      // Action
      const server = await createServer(container);
      const response = await server.inject({
        method: "PUT",
        url: `/threads/${threadId}/comments/invalid-comment/likes`,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(404);
      expect(responseJson.status).toEqual("fail");
      expect(responseJson.message).toEqual(
        "comment atau thread tidak ditemukan"
      );
    });

    it("should response 401 when access token is not provided", async () => {
      // Action
      const server = await createServer(container);
      const response = await server.inject({
        method: "PUT",
        url: `/threads/${threadId}/comments/${commentId}/likes`,
      });

      // Assert
      const responseJson = JSON.parse(response.payload);
      expect(response.statusCode).toEqual(401);
      expect(responseJson.error).toEqual("Unauthorized");
      expect(responseJson.message).toEqual("Missing authentication");
    });
  });
});
