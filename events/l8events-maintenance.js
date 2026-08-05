(function() {
    'use strict';

    const col = Layer8ColumnFactory;
    const enums = L8EventsEnums;
    const f = Layer8FormFactory;

    window.L8EventsMaintenance = {
        getColumns: function() {
            var columns = [
                ...col.col('name', 'Name'),
                ...col.status('status', 'Status', null, enums.render.maintenanceStatus),
                ...col.date('startTime', 'Start Time'),
                ...col.date('endTime', 'End Time'),
                ...col.enum('recurrence', 'Recurrence', null, enums.render.recurrenceType),
                ...col.col('createdBy', 'Created By'),
                ...col.date('createdAt', 'Created At')
            ];
            // Mobile card display (desktop table ignores these)
            columns[0].primary = true;   // name
            columns[1].secondary = true; // status
            return columns;
        },

        getFormDefinition: function() {
            return f.form('Maintenance Window', [
                f.section('Details', [
                    ...f.text('name', 'Name', true),
                    ...f.textarea('description', 'Description'),
                    ...f.select('status', 'Status', enums.MAINTENANCE_STATUS.enum)
                ]),
                f.section('Schedule', [
                    ...f.date('startTime', 'Start Time', true),
                    ...f.date('endTime', 'End Time', true),
                    ...f.select('recurrence', 'Recurrence', enums.RECURRENCE_TYPE.enum),
                    ...f.number('recurrenceInterval', 'Recurrence Interval')
                ]),
                f.section('Scope', [
                    ...f.text('scopeIds', 'Scope IDs (comma-separated)'),
                    ...f.text('scopeTypes', 'Scope Types (comma-separated)')
                ])
            ]);
        }
    };
})();
