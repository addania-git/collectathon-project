using System.Linq;
using System.Threading.Tasks;
using GameApi.Data;
using GameApi.DTOs;
using GameApi.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GameApi.Controllers
{
    [ApiController]
    [Route("api/v1/runscores")]
    public class RunScoresController : ControllerBase
    {
        private readonly AppDbContext _db;
        public RunScoresController(AppDbContext db) => _db = db;

        // GET: /api/v1/runscores/top?limit=5
        [HttpGet("top")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTop([FromQuery] int limit = 5)
        {
            limit = limit <= 0 ? 5 : (limit > 50 ? 50 : limit);

            // Best per unique name (keep most recent if tie)
            var bestPerName = await _db.RunScores.AsNoTracking()
                .GroupBy(r => r.Name)
                .Select(g => g
                    .OrderByDescending(r => r.Score)
                    .ThenByDescending(r => r.Date)
                    .FirstOrDefault())
                .OrderByDescending(r => r!.Score)
                .Take(limit)
                .Select(r => new RunScoreOutDto(r!.Name, r!.Score, r!.Date, r!.RunId))
                .ToListAsync();

            return Ok(bestPerName);
        }

        // POST: /api/v1/runscores
        [HttpPost]
        [AllowAnonymous]
        public async Task<ActionResult<RunScoreOutDto>> Submit(CreateRunScoreNameDto dto)
        {
            var name = (dto.Name ?? "").Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > 64)
                return BadRequest("Invalid name (1..64).");
            if (dto.Score < 0 || dto.Score > 9999)
                return BadRequest("Invalid score (0..9999).");

            var entity = new RunScore
            {
                Name = name,
                Score = dto.Score,
                Date = dto.Date.ToUniversalTime(),
                RunId = dto.RunId
            };
            _db.RunScores.Add(entity);
            await _db.SaveChangesAsync();

            var result = new RunScoreOutDto(entity.Name, entity.Score, entity.Date, entity.RunId);
            return CreatedAtAction(nameof(GetTop), new { }, result);
        }
    }
}