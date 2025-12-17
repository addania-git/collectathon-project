using System;
using System.Linq;
using GameDataManager.Models;

namespace GameDataManager.Services;

public static class Menu
{
    public static void MainLoop(
        InMemoryRepository<GameItem> itemRepo,
        InMemoryRepository<Character> charRepo)
    {
        while (true)
        {
            Console.WriteLine(@"
=== MAIN MENU ===
1) Generate sample data
2) Manage Items (CRUD/Search)
3) Manage Characters (CRUD/Assign/Unassign)
4) Analytics Dashboard (LINQ)
5) Import/Export JSON
6) Import Frontend Leaderboard JSON (optional)
0) Exit
");
            Console.Write("Select: ");
            var choice = Console.ReadLine();

            switch (choice)
            {
                case "1": GenerateData(itemRepo, charRepo); break;
                case "2": ItemsMenu(itemRepo, charRepo); break;
                case "3": CharactersMenu(itemRepo, charRepo); break;
                case "4": StatisticsService.PrintDashboard(itemRepo.GetAll(), charRepo.GetAll()); break;
                case "5": JsonMenu(itemRepo, charRepo); break;
                case "6": LeaderboardMenu(); break;
                case "0": return;
                default: Console.WriteLine("Invalid."); break;
            }
        }
    }

    private static void GenerateData(
        InMemoryRepository<GameItem> itemRepo,
        InMemoryRepository<Character> charRepo)
    {
        var chars = DataGenerator.GenerateCharacters(8);
        charRepo.ReplaceAll(chars);
        var items = DataGenerator.GenerateItems(40, chars);
        itemRepo.ReplaceAll(items);
        Console.WriteLine("Sample data generated.\n");
    }

    private static void ItemsMenu(
        InMemoryRepository<GameItem> itemRepo,
        InMemoryRepository<Character> charRepo)
    {
        while (true)
        {
            Console.WriteLine(@"
-- Items --
1) List all
2) Search (Category/Rarity/Name)
3) Create
4) Update
5) Delete
6) Assign to Character
7) Unassign from Character
0) Back
");
            Console.Write("Select: ");
            var c = Console.ReadLine();
            if (c == "0") return;

            if (c == "1")
            {
                foreach (var i in itemRepo.GetAll()) Console.WriteLine($"{i.Id} => {i}");
                Console.WriteLine();
            }
            else if (c == "2")
            {
                Console.Write("Name contains (optional): ");
                var q = (Console.ReadLine() ?? "").Trim();

                Console.Write("Category (Weapon/PowerUp/Cosmetic/Material or blank): ");
                var cstr = (Console.ReadLine() ?? "").Trim();
                ItemCategory? cat = Enum.TryParse<ItemCategory>(cstr, true, out var cval) ? cval : null;

                Console.Write("Rarity (Common/Uncommon/Rare/Epic/Legendary or blank): ");
                var rstr = (Console.ReadLine() ?? "").Trim();
                Rarity? rar = Enum.TryParse<Rarity>(rstr, true, out var rval) ? rval : null;

                var res = itemRepo.GetAll()
                    .Where(i => string.IsNullOrWhiteSpace(q) || i.Name.Contains(q, StringComparison.OrdinalIgnoreCase))
                    .Where(i => !cat.HasValue || i.Category == cat.Value)
                    .Where(i => !rar.HasValue || i.Rarity == rar.Value)
                    .OrderByDescending(i => i.Value);

                foreach (var i in res) Console.WriteLine($"{i.Id} => {i}");
                Console.WriteLine();
            }
            else if (c == "3")
            {
                var item = new GameItem();
                Console.Write("Name: "); item.Name = Console.ReadLine() ?? "New Item";

                Console.Write("Category (Weapon/PowerUp/Cosmetic/Material): ");
                Enum.TryParse<ItemCategory>(Console.ReadLine(), true, out var cat);
                item.Category = cat;

                Console.Write("Rarity (Common/Uncommon/Rare/Epic/Legendary): ");
                Enum.TryParse<Rarity>(Console.ReadLine(), true, out var rar);
                item.Rarity = rar;

                Console.Write("Level Requirement: ");
                int.TryParse(Console.ReadLine(), out var lvl);
                item.LevelRequirement = Math.Max(1, lvl);

                Console.Write("Value: ");
                int.TryParse(Console.ReadLine(), out var val);
                item.Value = Math.Max(0, val);

                if (item.Category == ItemCategory.Weapon)
                {
                    Console.Write("Damage: ");
                    double.TryParse(Console.ReadLine(), out var dmg);
                    Console.Write("Attack Speed: ");
                    double.TryParse(Console.ReadLine(), out var spd);
                    item.Damage = Math.Max(0, dmg);
                    item.AttackSpeed = Math.Max(0, spd);
                }
                else if (item.Category == ItemCategory.PowerUp)
                {
                    Console.Write("Power: ");
                    double.TryParse(Console.ReadLine(), out var pwr);
                    Console.Write("Duration (sec): ");
                    double.TryParse(Console.ReadLine(), out var dur);
                    item.Power = Math.Max(0, pwr);
                    item.DurationSec = Math.Max(0, dur);
                }

                itemRepo.Add(item);
                Console.WriteLine("Created.\n");
            }
            else if (c == "4")
            {
                Console.Write("Item Id: ");
                if (!Guid.TryParse(Console.ReadLine(), out var id)) { Console.WriteLine("Invalid Id.\n"); continue; }
                var item = itemRepo.Get(id);
                if (item is null) { Console.WriteLine("Not found.\n"); continue; }

                Console.Write($"Name ({item.Name}): "); var s = Console.ReadLine(); if (!string.IsNullOrWhiteSpace(s)) item.Name = s;
                Console.Write($"Value ({item.Value}): "); if (int.TryParse(Console.ReadLine(), out var v)) item.Value = Math.Max(0, v);
                Console.Write($"LevelRequirement ({item.LevelRequirement}): "); if (int.TryParse(Console.ReadLine(), out var l)) item.LevelRequirement = Math.Max(1, l);

                if (item.Category == ItemCategory.Weapon)
                {
                    Console.Write($"Damage ({item.Damage}): "); if (double.TryParse(Console.ReadLine(), out var dmg)) item.Damage = Math.Max(0, dmg);
                    Console.Write($"AttackSpeed ({item.AttackSpeed}): "); if (double.TryParse(Console.ReadLine(), out var spd)) item.AttackSpeed = Math.Max(0, spd);
                }
                else if (item.Category == ItemCategory.PowerUp)
                {
                    Console.Write($"Power ({item.Power}): "); if (double.TryParse(Console.ReadLine(), out var pwr)) item.Power = Math.Max(0, pwr);
                    Console.Write($"DurationSec ({item.DurationSec}): "); if (double.TryParse(Console.ReadLine(), out var dur)) item.DurationSec = Math.Max(0, dur);
                }

                itemRepo.Update(item);
                Console.WriteLine("Updated.\n");
            }
            else if (c == "5")
            {
                Console.Write("Item Id: ");
                if (Guid.TryParse(Console.ReadLine(), out var id) && itemRepo.Delete(id))
                    Console.WriteLine("Deleted.\n");
                else Console.WriteLine("Not found.\n");
            }
            else if (c == "6")
            {
                Console.Write("Item Id: ");
                if (!Guid.TryParse(Console.ReadLine(), out var iid)) { Console.WriteLine("Invalid.\n"); continue; }
                var item = itemRepo.Get(iid); if (item is null) { Console.WriteLine("Item not found.\n"); continue; }

                Console.Write("Character Id: ");
                if (!Guid.TryParse(Console.ReadLine(), out var cid)) { Console.WriteLine("Invalid.\n"); continue; }
                var ch = charRepo.Get(cid); if (ch is null) { Console.WriteLine("Character not found.\n"); continue; }

                item.OwnerCharacterId = ch.Id;
                if (!ch.InventoryItemIds.Contains(item.Id)) ch.InventoryItemIds.Add(item.Id);
                itemRepo.Update(item); charRepo.Update(ch);
                Console.WriteLine("Assigned.\n");
            }
            else if (c == "7")
            {
                Console.Write("Item Id: ");
                if (!Guid.TryParse(Console.ReadLine(), out var iid)) { Console.WriteLine("Invalid.\n"); continue; }
                var item = itemRepo.Get(iid); if (item is null) { Console.WriteLine("Item not found.\n"); continue; }

                if (item.OwnerCharacterId is Guid ownerId)
                {
                    var ch = charRepo.Get(ownerId);
                    ch?.InventoryItemIds.Remove(item.Id);
                }
                item.OwnerCharacterId = null;
                itemRepo.Update(item);
                Console.WriteLine("Unassigned.\n");
            }
        }
    }

    private static void CharactersMenu(
        InMemoryRepository<GameItem> itemRepo,
        InMemoryRepository<Character> charRepo)
    {
        while (true)
        {
            Console.WriteLine(@"
-- Characters --
1) List all
2) Create
3) Update
4) Delete
0) Back
");
            Console.Write("Select: ");
            var c = Console.ReadLine();
            if (c == "0") return;

            if (c == "1")
            {
                foreach (var ch in charRepo.GetAll())
                    Console.WriteLine($"{ch.Id} => {ch}");
                Console.WriteLine();
            }
            else if (c == "2")
            {
                var ch = new Character();
                Console.Write("Name: "); ch.Name = Console.ReadLine() ?? "New";
                Console.Write("Class: "); ch.Class = Console.ReadLine() ?? "Pilot";
                Console.Write("Level: "); int.TryParse(Console.ReadLine(), out var lvl); ch.Level = Math.Max(1, lvl);
                Console.Write("Experience: "); int.TryParse(Console.ReadLine(), out var xp); ch.Experience = Math.Max(0, xp);
                charRepo.Add(ch);
                Console.WriteLine("Created.\n");
            }
            else if (c == "3")
            {
                Console.Write("Character Id: ");
                if (!Guid.TryParse(Console.ReadLine(), out var id)) { Console.WriteLine("Invalid.\n"); continue; }
                var ch = charRepo.Get(id); if (ch is null) { Console.WriteLine("Not found.\n"); continue; }

                Console.Write($"Name ({ch.Name}): "); var s = Console.ReadLine(); if (!string.IsNullOrWhiteSpace(s)) ch.Name = s;
                Console.Write($"Class ({ch.Class}): "); s = Console.ReadLine(); if (!string.IsNullOrWhiteSpace(s)) ch.Class = s;
                Console.Write($"Level ({ch.Level}): "); if (int.TryParse(Console.ReadLine(), out var lvl)) ch.Level = Math.Max(1, lvl);
                Console.Write($"Experience ({ch.Experience}): "); if (int.TryParse(Console.ReadLine(), out var xp)) ch.Experience = Math.Max(0, xp);

                charRepo.Update(ch);
                Console.WriteLine("Updated.\n");
            }
            else if (c == "4")
            {
                Console.Write("Character Id: ");
                if (!Guid.TryParse(Console.ReadLine(), out var id)) { Console.WriteLine("Invalid.\n"); continue; }

                // Clean up owner references
                foreach (var it in itemRepo.GetAll().Where(i => i.OwnerCharacterId == id))
                {
                    it.OwnerCharacterId = null;
                    itemRepo.Update(it);
                }

                if (charRepo.Delete(id)) Console.WriteLine("Deleted.\n");
                else Console.WriteLine("Not found.\n");
            }
        }
    }

    private static void JsonMenu(
        InMemoryRepository<GameItem> itemRepo,
        InMemoryRepository<Character> charRepo)
    {
        Console.WriteLine(@"
-- JSON Import/Export --
1) Export items to Data/items.json
2) Export characters to Data/characters.json
3) Import items from Data/items.json
4) Import characters from Data/characters.json
0) Back
");
        Console.Write("Select: ");
        var c = Console.ReadLine();

        Directory.CreateDirectory("Data");

        switch (c)
        {
            case "1":
                PersistenceService.SaveItems("Data/items.json", itemRepo.GetAll());
                Console.WriteLine("Items exported.\n"); break;
            case "2":
                PersistenceService.SaveCharacters("Data/characters.json", charRepo.GetAll());
                Console.WriteLine("Characters exported.\n"); break;
            case "3":
                var items = PersistenceService.LoadItems("Data/items.json");
                itemRepo.ReplaceAll(items);
                Console.WriteLine($"Loaded {items.Count} items.\n"); break;
            case "4":
                var chars = PersistenceService.LoadCharacters("Data/characters.json");
                charRepo.ReplaceAll(chars);
                Console.WriteLine($"Loaded {chars.Count} characters.\n"); break;
        }
    }

    private static void LeaderboardMenu()
    {
        Console.WriteLine("Will read Data/leaderboard.json.");
        Directory.CreateDirectory("Data");
        var scores = PersistenceService.LoadLeaderboard("Data/leaderboard.json");
        StatisticsService.PrintLeaderboardStats(scores);
    }
}