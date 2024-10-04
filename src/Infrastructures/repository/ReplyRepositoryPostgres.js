const AddedReply = require('../../Domains/replies/entities/AddedReply');
const ReplyRepository = require('../../Domains/replies/ReplyRepository');
const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AuthorizationError = require('../../Commons/exceptions/AuthorizationError');

class ReplyRepositoryPostgres extends ReplyRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;

    this.addReply = this.addReply.bind(this);
    this.isReplyExistInComment = this.isReplyExistInComment.bind(this);
    this.verifyReplyOwner = this.verifyReplyOwner.bind(this);
    this.getRepliesByCommentId = this.getRepliesByCommentId.bind(this);
    this.getRepliesByThreadId = this.getRepliesByThreadId.bind(this);
    this.deleteReplyById = this.deleteReplyById.bind(this);
  }

  async addReply({
    content, owner, threadId, commentId,
  }) {
    const id = `reply-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5) RETURNING id, content, owner',
      values: [id, content, owner, commentId, threadId],
    };

    const result = await this._pool.query(query);

    return new AddedReply(result.rows[0]);
  }

  async isReplyExistInComment(replyId, commentId) {
    const query = {
      text: 'SELECT id FROM replies WHERE id = $1 AND comment_id = $2',
      values: [replyId, commentId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('reply atau comment tidak ditemukan');
    }
  }

  async verifyReplyOwner(replyId, owner) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1 AND owner = $2',
      values: [replyId, owner],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new AuthorizationError('Anda tidak berhak mengakses resource ini');
    }

    return true;
  }

  async getRepliesByCommentId(commentId) {
    const query = {
      text: `SELECT replies.id, replies.content, users.username, replies.date, replies.is_delete 
              FROM replies
              JOIN users ON replies.owner = users.id 
              WHERE replies.comment_id = $1
              ORDER BY replies.date ASC`,
      values: [commentId],
    };

    const result = await this._pool.query(query);

    return result.rows;
  }

  async getRepliesByThreadId(threadId) {
    const query = {
      text: `SELECT replies.id, replies.content, users.username, replies.date, replies.is_delete, replies.comment_id
              FROM replies
              JOIN users ON replies.owner = users.id 
              WHERE replies.thread_id = $1
              ORDER BY replies.date ASC`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    const mappedResult = result.rows.map(
      ({
        id, content, username, date, is_delete, comment_id,
      }) => ({
        id,
        content,
        username,
        date,
        is_delete,
        commentId: comment_id,
      }),
    );

    return mappedResult;
  }

  async deleteReplyById(replyId) {
    const query = {
      text: 'UPDATE replies SET is_delete = true WHERE id = $1',
      values: [replyId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('reply tidak ditemukan');
    }
  }
}

module.exports = ReplyRepositoryPostgres;
