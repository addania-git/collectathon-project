using System;
using GameDataManager.Models;
using GameDataManager.Services;

var itemRepo = new InMemoryRepository<GameItem>(x => x.Id, (x, id) => x.Id = id);
var charRepo = new InMemoryRepository<Character>(x => x.Id, (x, id) => x.Id = id);

Console.WriteLine("Video Game Data Management System (Console)");
Console.WriteLine("===========================================\n");

Menu.MainLoop(itemRepo, charRepo);