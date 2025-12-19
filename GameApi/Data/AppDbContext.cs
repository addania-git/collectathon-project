using Microsoft.EntityFrameworkCore;
using GameApi.Models;

namespace GameApi.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<RunScore> RunScores => Set<RunScore>();

        protected override void OnModelCreating(ModelBuilder b)
        {
            base.OnModelCreating(b);

            b.Entity<RunScore>(e =>
            {
                e.HasKey(x => x.Id);
                e.Property(x => x.Name).HasMaxLength(64).IsRequired();
                e.Property(x => x.Score).IsRequired();
                e.Property(x => x.Date).IsRequired();
                e.HasIndex(x => x.Score);
            });
        }
    }
}