/* istanbul ignore file */
const pool = require('../src/Infrastructures/database/postgres/pool');

const LikeCommentTableTestHelper = {
  async addLikeComment({
    id = 'like-comment-123',
    commentId = 'comment-123',
    owner = 'user-123',
  }) {
    const query = {
      text: 'INSERT INTO comments_likes VALUES($1, $2, $3)',
      values: [id, commentId, owner],
    };

    await pool.query(query);
  },

  async deleteLikeCommentById(id) {
    const query = {
      text: 'DELETE FROM comments_likes WHERE id = $1',
      values: [id],
    };

    await pool.query(query);
  },

  async getLikeCommentById(id) {
    const query = {
      text: 'SELECT * FROM comments_likes WHERE id = $1',
      values: [id],
    };

    const { rows } = await pool.query(query);

    return rows;
  },

  async cleanTable() {
    await pool.query('DELETE FROM comments_likes WHERE 1=1');
  },
};

module.exports = LikeCommentTableTestHelper;
