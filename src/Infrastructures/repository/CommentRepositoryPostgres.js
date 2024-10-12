const AuthorizationError = require("../../Commons/exceptions/AuthorizationError");
const NotFoundError = require("../../Commons/exceptions/NotFoundError");
const CommentRepository = require("../../Domains/comments/CommentRepository");
const AddedComment = require("../../Domains/comments/entities/AddedComment");

class CommentRepositoryPostgres extends CommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;

    this.addComment = this.addComment.bind(this);
    this.isCommentExistInThread = this.isCommentExistInThread.bind(this);
    this.verifyCommentOwner = this.verifyCommentOwner.bind(this);
    this.getCommentsByThreadId = this.getCommentsByThreadId.bind(this);
    this.deleteCommentById = this.deleteCommentById.bind(this);
  }

  async addComment({ content, owner, threadId }) {
    const id = `comment-${this._idGenerator()}`;

    const query = {
      text: "INSERT INTO comments VALUES($1, $2, $3, $4) RETURNING id, content, owner",
      values: [id, content, owner, threadId],
    };

    const result = await this._pool.query(query);

    return new AddedComment(result.rows[0]);
  }

  async isCommentExistInThread(commentId, threadId) {
    const query = {
      text: "SELECT id FROM comments WHERE id = $1 AND thread_id = $2",
      values: [commentId, threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("comment atau thread tidak ditemukan");
    }
  }

  async verifyCommentOwner(commentId, owner) {
    const query = {
      text: "SELECT * FROM comments WHERE id = $1 AND owner = $2",
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError("Anda tidak berhak mengakses resource ini");
    }
  }

  async getCommentsByThreadId(threadId) {
    const query = {
      text: `SELECT comments.id, comments.content, users.username, comments.date, comments.is_delete
                FROM comments
                INNER JOIN users ON comments.owner = users.id
                WHERE comments.thread_id = $1
                ORDER BY comments.date ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async deleteCommentById(commentId) {
    const query = {
      text: "UPDATE comments SET is_delete = true WHERE id = $1",
      values: [commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError("comment tidak ditemukan");
    }
  }
}

module.exports = CommentRepositoryPostgres;
