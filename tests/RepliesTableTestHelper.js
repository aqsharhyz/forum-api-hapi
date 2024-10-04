/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const RepliesTableTestHelper = {
  async addReply({
    id = 'reply-123',
    content = 'test reply',
    owner = 'user-123',
    commentId = 'comment-123',
    threadId = 'thread-123',
    is_delete = false,
  }) {
    const query = {
      text: 'INSERT INTO replies VALUES($1, $2, $3, $4, $5, $6)',
      values: [id, content, owner, commentId, threadId, is_delete],
    };

    await pool.query(query);
  },

  async deleteReplyById(id) {
    const query = {
      text: 'UPDATE replies SET is_delete = true WHERE id = $1',
      values: [id],
    };

    const { rows } = await pool.query(query);

    return rows;
  },

  async getReplyById(id) {
    const query = {
      text: 'SELECT * FROM replies WHERE id = $1',
      values: [id],
    };

    const { rows } = await pool.query(query);

    return rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM replies WHERE 1=1');
  },
};

module.exports = RepliesTableTestHelper;
