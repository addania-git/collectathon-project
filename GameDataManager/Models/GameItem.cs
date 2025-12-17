using System;
using GameDataManager.Models;

namespace GameDataManager.Models;

public class GameItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public ItemCategory Category { get; set; }
    public Rarity Rarity { get; set; }
    public int LevelRequirement { get; set; }
    public int Value { get; set; } // in-game currency

    // Optional gameplay fields
    public double Damage { get; set; }       // for weapons
    public double AttackSpeed { get; set; }  // for weapons (DPS = Damage * AttackSpeed)
    public double Power { get; set; }        // for power-ups (generic magnitude)
    public double DurationSec { get; set; }  // for power-ups

    // Relationship
    public Guid? OwnerCharacterId { get; set; }

    public double Dps => Math.Round(Damage * AttackSpeed, 2);

    public override string ToString()
        => $"{Name} [{Category}, {Rarity}] Lvl {LevelRequirement}, Value {Value}" +
           (Category == ItemCategory.Weapon ? $", DPS {Dps}" : "") +
           (Category == ItemCategory.PowerUp ? $", Power {Power} for {DurationSec}s" : "") +
           (OwnerCharacterId.HasValue ? $" (Owner: {OwnerCharacterId})" : "");
}