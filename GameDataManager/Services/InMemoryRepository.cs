using System;
using System.Collections.Generic;
using System.Linq;
using GameDataManager.Models;

namespace GameDataManager.Services;

public class InMemoryRepository<T> where T : class
{
    private readonly List<T> _data = new();
    private readonly Func<T, Guid> _getId;
    private readonly Action<T, Guid> _setId;

    public InMemoryRepository(Func<T, Guid> getId, Action<T, Guid> setId)
    {
        _getId = getId;
        _setId = setId;
    }

    public IEnumerable<T> GetAll() => _data;

    public T? Get(Guid id) => _data.FirstOrDefault(x => _getId(x) == id);

    public void Add(T entity)
    {
        if (_getId(entity) == Guid.Empty) _setId(entity, Guid.NewGuid());
        _data.Add(entity);
    }

    public bool Update(T entity)
    {
        var id = _getId(entity);
        var idx = _data.FindIndex(x => _getId(x) == id);
        if (idx < 0) return false;
        _data[idx] = entity;
        return true;
    }

    public bool Delete(Guid id)
    {
        var e = Get(id);
        if (e is null) return false;
        return _data.Remove(e);
    }

    public void ReplaceAll(IEnumerable<T> newData)
    {
        _data.Clear();
        _data.AddRange(newData);
    }
}