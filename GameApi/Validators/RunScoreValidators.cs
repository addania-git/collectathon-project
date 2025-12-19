using FluentValidation;
using GameApi.DTOs;
using System;

namespace GameApi.Validators
{
    public class CreateRunScoreNameValidator : AbstractValidator<CreateRunScoreNameDto>
    {
        public CreateRunScoreNameValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .MaximumLength(64);

            RuleFor(x => x.Score)
                .GreaterThanOrEqualTo(0)
                .LessThanOrEqualTo(9999);

            RuleFor(x => x.Date)
                .LessThanOrEqualTo(DateTime.UtcNow.AddMinutes(5));

            RuleFor(x => x.RunId)
                .GreaterThan(0);
        }
    }
}