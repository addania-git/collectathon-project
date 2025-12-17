using System;

namespace GameDataManager.Models;

// Matches your frontend structure: { score, date, runId }
public class RunScore
{
    public int Score { get; set; }
    public DateTime Date { get; set; }
       public long RunId { get; set; }
}