using System;

namespace GameApi.Models
{
    public class RunScore
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";   // NEW: store player name
        public int Score { get; set; }
        public DateTime Date { get; set; }
        public long RunId { get; set; }
       }
}