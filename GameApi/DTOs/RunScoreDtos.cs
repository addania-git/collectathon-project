using System;

namespace GameApi.DTOs
{
    public record RunScoreOutDto(string Name, int Score, DateTime Date, long RunId);
    public record CreateRunScoreNameDto(string Name, int Score, DateTime Date, long RunId);
}