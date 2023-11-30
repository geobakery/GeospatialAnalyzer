export default () => ({
  database: {
    db_name: process.env.db_name,
  },
  topics: process.env.topics.split(', '),
});
