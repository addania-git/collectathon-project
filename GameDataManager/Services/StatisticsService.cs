using System;
using System.Collections.Generic;
using System.Linq;
using GameDataManager.Models;

namespace GameDataManager.Services;

public static class StatisticsService
{
    public static void PrintDashboard(IEnumerable<GameItem> items, IEnumerable<Character> chars)
    {
        Console.WriteLine("=== DATA STATISTICS DASHBOARD ===\n");

        // Totals
        Console.WriteLine($"Total Items: {items.Count()}");
        Console.WriteLine($"Total Characters: {chars.Count()}\n");

        // Counts by category
        var byCat = items.GroupBy(i => i.Category)
                         .Select(g => new { Category = g.Key, Count = g.Count() })
                         .OrderByDescending(x => x.Count);
        Console.WriteLine("-- Items by Category --");
        foreach (var x in byCat) Console.WriteLine($"{x.Category,-10} {x.Count}");
        Console.WriteLine();

        // Counts by rarity
        var byRar = items.GroupBy(i => i.Rarity)
                         .Select(g => new { Rarity = g.Key, Count = g.Count() })
                         .OrderBy(x => x.Rarity);
        Console.WriteLine("-- Items by Rarity --");
        foreach (var x in byRar) Console.WriteLine($"{x.Rarity,-10} {x.Count}");
        Console.WriteLine();

        // Avg value by rarity
        var avgVal = items.GroupBy(i => i.Rarity)
                          .Select(g => new { Rarity = g.Key, Avg = g.Average(i => i.Value) })
                          .OrderBy(x => x.Rarity);
        Console.WriteLine("-- Avg Item Value by Rarity --");
        foreach (var x in avgVal) Console.WriteLine($"{x.Rarity,-10} {x.Avg:F1}");
        Console.WriteLine();

        // Top weapons by DPS
        var topWeapons = items.Where(i => i.Category == ItemCategory.Weapon)
                              .OrderByDescending(i => i.Dps).Take(5);
        Console.WriteLine("-- Top 5 Weapons by DPS --");
        foreach (var i in topWeapons)
            Console.WriteLine($"{i.Name,-22} DPS={i.Dps,-6} (Rarity={i.Rarity})");
        Console.WriteLine();

        // Character with most items / richest inventory
        var charWithCounts = chars.Select(c => new {
            Character = c,
            Count = c.InventoryItemIds.Count,
            TotalValue = c.InventoryItemIds
                .Join(items, id => id, it => it.Id, (id, it) => it.Value)
                .Sum()
        });

        var mostPacked = charWithCounts.OrderByDescending(x => x.Count).FirstOrDefault();
        var richest = charWithCounts.OrderByDescending(x => x.TotalValue).FirstOrDefault();
        var highestLevel = chars.OrderByDescending(c => c.Level).FirstOrDefault();

        Console.WriteLine("-- Characters Summary --");
        if (mostPacked != null)
            Console.WriteLine($"Most Items : {mostPacked.Character.Name} ({mostPacked.Count})");
        if (richest != null)
            Console.WriteLine($"Richest Inv: {richest.Character.Name} (Total Value {richest.TotalValue})");
        if (highestLevel != null)
            Console.WriteLine($"Highest Lvl: {highestLevel.Name} (Lvl {highestLevel.Level})");

        Console.WriteLine("\n=== END DASHBOARD ===\n");
    }

    public static void PrintLeaderboardStats(IEnumerable<RunScore> scores)
    {
        if (!scores.Any())
        {
            Console.WriteLine("No leaderboard data.");
            return;
        }

        var top5 = scores.OrderByDescending(s => s.Score).Take(5).ToList();
        var avg = scores.Average(s => s.Score);
        var today = DateTime.UtcNow.Date;
        var last7 = scores.Where(s => s.Date >= today.AddDays(-7))
                          .OrderByDescending(s => s.Date).ToList();

        Console.WriteLine("=== Leaderboard Summary ===");
        Console.WriteLine($"Entries       : {scores.Count()}");
        Console.WriteLine($"Average Score : {avg:F2}");
        Console.WriteLine("Top 5:");
        foreach (var s in top5) Console.WriteLine($" - {s.Score} on {s.Date:u}");
        Console.WriteLine("Recent (7 days):");
        foreach (var s in last7) Console.WriteLine($" - {s.Score} on {s.Date:u}");
        Console.WriteLine("===========================\n");
    }
}