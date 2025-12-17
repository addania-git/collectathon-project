using System.Collections.Generic;
using System.IO;
using System.Text.Json;
using System.Text.Json.Serialization;
using GameDataManager.Models;

namespace GameDataManager.Services;

public static class PersistenceService
{
    private static readonly JsonSerializerOptions Options = new()
    {
        WriteIndented = true,
        Converters = { new JsonStringEnumConverter() }
    };

    public static void SaveItems(string path, IEnumerable<GameItem> items)
        => File.WriteAllText(path, JsonSerializer.Serialize(items, Options));

    public static void SaveCharacters(string path, IEnumerable<Character> chars)
        => File.WriteAllText(path, JsonSerializer.Serialize(chars, Options));

    public static List<GameItem> LoadItems(string path)
        => File.Exists(path)
           ? JsonSerializer.Deserialize<List<GameItem>>(File.ReadAllText(path), Options) ?? new()
           : new();

    public static List<Character> LoadCharacters(string path)
        => File.Exists(path)
           ? JsonSerializer.Deserialize<List<Character>>(File.ReadAllText(path), Options) ?? new()
           : new();

    public static List<RunScore> LoadLeaderboard(string path)
        => File.Exists(path)
           ? JsonSerializer.Deserialize<List<RunScore>>(File.ReadAllText(path), Options) ?? new()
           : new();
}