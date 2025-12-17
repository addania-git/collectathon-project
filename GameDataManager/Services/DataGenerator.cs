using System;
using System.Collections.Generic;
using System.Linq;
using GameDataManager.Models;

namespace GameDataManager.Services;

public static class DataGenerator
{
    private static readonly Random Rng = new();

    private static T Rand<T>(IReadOnlyList<T> arr) => arr[Rng.Next(arr.Count)];

    public static List<Character> GenerateCharacters(int count = 8)
    {
        var names = new[] { "Avi", "Nova", "Jax", "Ryn", "Kira", "Sol", "Mako", "Vee", "Luna", "Zed" };
        var classes = new[] { "Pilot", "Scout", "Engineer", "Guardian" };

        return Enumerable.Range(0, count).Select(_ => new Character {
            Name = Rand(names),
            Class = Rand(classes),
            Level = Rng.Next(1, 51),
            Experience = Rng.Next(0, 200_000)
        }).ToList();
    }

    public static List<GameItem> GenerateItems(int count = 40, IReadOnlyList<Character>? chars = null)
    {
        var names = new[]
        {
            "Feather Blaster","Turbo Wing","Echo Blade","Sky Lance","Glide Charm",
            "Storm Core","Nebula Dye","Wind Prism","Pulse Saber","Arc Coil",
            "Quantum Feeder","Sonic Booster","Diamond Feather","Aurora Shard"
        };
        var categories = (ItemCategory[])Enum.GetValues(typeof(ItemCategory));
        var rarities = (Rarity[])Enum.GetValues(typeof(Rarity));

        var items = new List<GameItem>();
        for (int i = 0; i < count; i++)
        {
            var cat = Rand(categories);
            var rar = Rand(rarities);

            var item = new GameItem
            {
                Name = $"{Rand(names)} {((char)('A' + Rng.Next(0, 26)))}",
                Category = cat,
                Rarity = rar,
                LevelRequirement = Rng.Next(1, 51),
                Value = Rng.Next(50, 5000)
            };

            if (cat == ItemCategory.Weapon)
            {
                item.Damage = Math.Round(Rng.NextDouble() * 90 + 10, 2);       // 10–100
                item.AttackSpeed = Math.Round(Rng.NextDouble() * 2.0 + 0.5, 2); // 0.5–2.5
            }
            else if (cat == ItemCategory.PowerUp)
            {
                item.Power = Math.Round(Rng.NextDouble() * 50 + 10, 2); // magnitude
                item.DurationSec = Math.Round(Rng.NextDouble() * 8 + 2, 2); // 2–10s
            }

            // Randomly assign to a character (30% chance)
            if (chars != null && chars.Count > 0 && Rng.NextDouble() < 0.3)
            {
                var c = Rand(chars);
                item.OwnerCharacterId = c.Id;
                c.InventoryItemIds.Add(item.Id);
            }

            items.Add(item);
        }
        return items;
    }
}