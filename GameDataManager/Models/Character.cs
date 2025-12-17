using System;
using System.Collections.Generic;

namespace GameDataManager.Models;

public class Character
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = "";
    public string Class { get; set; } = "Pilot";
    public int Level { get; set; }
    public int Experience { get; set; }
    public List<Guid> InventoryItemIds { get; set; } = new();

    public override string ToString()
        => $"{Name} (Lvl {Level} {Class}) XP={Experience} Items={InventoryItemIds.Count}";
}