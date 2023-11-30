export default () => ({
  database: {
    db_name: process.env.db_name,
    port: parseInt(process.env.db_postgres_port, 10) || 5432,
  },
  topics: ['verw_land_f', 'verw_kreis_f', 'verw_gem_f'],
});
