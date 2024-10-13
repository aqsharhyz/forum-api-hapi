const LikeCommentRepository = require("../../Domains/like_comment/LikeCommentRepository");

class LikeCommentRepositoryPostgres extends LikeCommentRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;

    this.checkLikeComment = this.checkLikeComment.bind(this);
    this.likeComment = this.likeComment.bind(this);
    this.unlikeComment = this.unlikeComment.bind(this);
  }

  async checkLikeComment(commentId, owner) {
    const query = {
      text: "SELECT * FROM comments_likes WHERE comment_id = $1 AND owner = $2",
      values: [commentId, owner],
    };

    const result = await this._pool.query(query);

    return result.rowCount;
  }

  async likeComment(commentId, owner) {
    const id = `like-comment-${this._idGenerator()}`;

    const query = {
      text: "INSERT INTO comments_likes VALUES($1, $2, $3)",
      values: [id, commentId, owner],
    };

    await this._pool.query(query);
  }

  async unlikeComment(commentId, owner) {
    const query = {
      text: "DELETE FROM comments_likes WHERE comment_id = $1 AND owner = $2",
      values: [commentId, owner],
    };

    await this._pool.query(query);
  }

  async getLikeCountByCommentId(commentId) {
    const query = {
      text: "SELECT COUNT(*) FROM comments_likes WHERE comment_id = $1",
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return Number(result.rows[0].count);
  }
}

module.exports = LikeCommentRepositoryPostgres;
