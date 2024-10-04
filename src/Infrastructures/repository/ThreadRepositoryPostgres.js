const NotFoundError = require('../../Commons/exceptions/NotFoundError');
const AddedThread = require('../../Domains/threads/entities/AddedThread');
const ThreadRepository = require('../../Domains/threads/ThreadRepository');

class ThreadRepositoryPostgres extends ThreadRepository {
  constructor(pool, idGenerator) {
    super();
    this._pool = pool;
    this._idGenerator = idGenerator;

    this.addThread = this.addThread.bind(this);
    this.getThreadById = this.getThreadById.bind(this);
    this.isThreadExist = this.isThreadExist.bind(this);
  }

  async addThread({ title, body, owner }) {
    const id = `thread-${this._idGenerator()}`;

    const query = {
      text: 'INSERT INTO threads VALUES($1, $2, $3, $4) RETURNING id, title, body, owner',
      values: [id, title, body, owner],
    };

    const result = await this._pool.query(query);

    return new AddedThread(result.rows[0]);
  }

  async getThreadById(threadId) {
    const query = {
      text: `SELECT threads.id as id, title, body, date, users.username as username
            FROM threads LEFT JOIN users ON threads.owner = users.id
            WHERE threads.id = $1`,
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }

    return result.rows[0];
  }

  async isThreadExist(threadId) {
    const query = {
      text: 'SELECT id FROM threads WHERE id = $1',
      values: [threadId],
    };

    const result = await this._pool.query(query);

    if (!result.rowCount) {
      throw new NotFoundError('thread tidak ditemukan');
    }
  }
}

module.exports = ThreadRepositoryPostgres;
