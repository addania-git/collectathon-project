using GameApi.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
options.UseSqlite(builder.Configuration.GetConnectionString("Default")
?? "Data Source=runscores.db"));

builder.Services.AddControllers()
.AddJsonOptions(o =>
{
    o.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    o.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
    
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", p => p.WithOrigins
        ("http://127.0.0.1:5500", "http://localhost:5500",
        "http://127.0.0.1:8080", "http://localhost:8080")
        .AllowAnyHeader()
        .AllowAnyMethod());
        });
        
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo { Title = "GameApi", Version = "v1" });
            });
            
            var app = builder.Build();
            
            app.UseCors("Frontend");
            app.UseHttpsRedirection();
            
            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "GameApi v1"));
            
            app.MapControllers();
            
            using (var scope = app.Services.CreateScope()){
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                db.Database.Migrate();
                }
                
                app.Run();