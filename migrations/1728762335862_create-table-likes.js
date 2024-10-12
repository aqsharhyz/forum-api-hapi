exports.up = (pgm) => {
  pgm.createTable("comments_likes", {
    id: {
      type: "VARCHAR(50)",
      primaryKey: true,
    },
    comment_id: {
      type: "VARCHAR(50)",
      notNull: true,
    },
    owner: {
      type: "VARCHAR(50)",
      notNull: true,
    },
  });

  pgm.addConstraint(
    "comments_likes",
    "fk_comments_likes.comment_id_comments.id",
    "FOREIGN KEY(comment_id) REFERENCES comments(id) ON DELETE CASCADE"
  );
  pgm.addConstraint(
    "comments_likes",
    "fk_comments_likes.owner_users.id",
    "FOREIGN KEY(owner) REFERENCES users(id) ON DELETE CASCADE"
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint(
    "comments_likes",
    "fk_comments_likes.comment_id_comments.id"
  );
  pgm.dropConstraint("comments_likes", "fk_comments_likes.owner_users.id");
  pgm.dropTable("comments_likes");
};
