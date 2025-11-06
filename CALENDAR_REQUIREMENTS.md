# Calendar Date Picker - Requirements & Implementation Guide

## Overview
Enhance the calendar date picker component to provide a seamless appointment booking experience with proper date availability visualization, time slot selection, and appointment persistence.

## Current Status
- ✅ Data fetching from DriCloud API is working correctly for doctors and specialties
- ❌ Calendar date selection is not working properly
- ❌ Available/unavailable dates are not visually distinguishable
- ❌ Time slots are not displaying correctly
- ❌ Appointment booking data needs to be persisted to CRM and database

## Requirements

### 1. Calendar Functionality

#### Date Selection
- **Enable date selection**: Users must be able to click and select dates from the calendar
- **Visual feedback**: Selected dates should be clearly highlighted
- **Month navigation**: Implement a dropdown selector for months and years (date picker style)
- **Date availability**: Clearly distinguish between:
  - Available dates (with available time slots)
  - Unavailable dates (no time slots available)
  - Past dates (disabled, not selectable)

#### Calendar UI/UX
- Use a modern date picker interface with month/year dropdowns
- Display calendar in a clean, user-friendly layout
- Ensure responsive design for mobile and desktop
- Apply brand colors consistently throughout the calendar component

### 2. Doctor Availability Synchronization

#### Real-time Availability
- Fetch doctor availability from DriCloud API for the selected doctor
- Parse availability data correctly (format: `YYYYMMDD:HHMM` or similar)
- Filter out past dates and times
- Group available time slots by date
- Update calendar when doctor selection changes
- Refresh availability after appointment confirmation

#### Data Structure
- Store full availability data: `{ date: string, times: string[] }[]`
- Handle API response format: `{ Successful: boolean, Data: { Disponibilidad: string[] } }`
- Parse dates correctly from format `YYYYMMDD:HHMM`

### 3. Time Slot Display

#### Time Selection UI
- Display available time slots in a grid or list format
- Show time slots only for the selected date
- Use brand colors for time slot buttons:
  - **Available slots**: Use accent color (`#EAC607` - yellow/gold) or primary color
  - **Selected slot**: Use hover color (`#033B4A` - dark teal) or success color (`#22AD5C` - green)
  - **Disabled/past slots**: Use disabled color (`#EFEFEF` - light gray)
- Format times in 12-hour format with AM/PM (e.g., "2:30 PM")
- Show loading state while fetching time slots
- Disable time slots that are in the past

#### Time Slot Styling
- Apply brand colors from Tailwind config:
  - Primary colors: `#242424` (dark), `#F9FAFA` (light)
  - Accent: `#EAC607` (yellow/gold)
  - Success: `#22AD5C` (green)
  - Hover: `#033B4A` (dark teal)
  - Disabled: `#EFEFEF` (light gray)
- Use consistent button styling with proper hover states
- Ensure time slots are easily clickable on mobile devices

### 4. Appointment Booking & Persistence

#### Booking Flow
1. User selects a date from the calendar
2. Available time slots for that date are displayed
3. User selects a time slot
4. Appointment data is sent to the API
5. On success, appointment is saved to:
   - **CRM system** (via API endpoint)
   - **Database** (DynamoDB or preferred service)
   - **DriCloud** (via existing integration)

#### Data to Persist
- Doctor ID
- Patient information (from form)
- Selected date and time
- Service/specialty
- Appointment status
- Timestamp of booking
- Any additional metadata

#### API Integration
- Use existing appointment creation endpoint
- Handle success/error responses
- Show confirmation message to user
- Refresh calendar to hide booked time slot

### 5. Technical Implementation Details

#### Component Structure
```typescript
CalendarDatePicker
├── Month/Year Dropdown Selector
├── Calendar Grid (react-calendar)
│   ├── Available dates (highlighted)
│   ├── Unavailable dates (grayed out)
│   └── Selected date (emphasized)
└── Time Slots Grid
    ├── Available time buttons
    └── Selected time button
```

#### State Management
- `selectedDate`: Currently selected date
- `availableDates`: Array of dates with available slots
- `availableTimes`: Array of time slots for selected date
- `loadingDate`: Loading state for date availability
- `loadingTime`: Loading state for time slots
- `fullAvailableData`: Complete availability data from API

#### API Calls
- `getDoctorAgenda(doctorId, startDate, datesToFetch)`: Fetch availability
- `createAppointment(appointmentData)`: Create appointment
- Handle API errors gracefully with user-friendly messages

#### Styling Requirements
- Use Tailwind CSS classes with brand colors
- Ensure styles are scoped to `#gua-widget-container` to avoid WordPress conflicts
- Use "Work Sans" font family
- Apply consistent spacing and padding
- Mobile-first responsive design

### 6. User Experience Enhancements

#### Visual Feedback
- Show loading spinners during API calls
- Display error messages if availability fetch fails
- Show success confirmation after booking
- Disable calendar during loading states
- Highlight selected date and time clearly

#### Accessibility
- Ensure keyboard navigation works
- Add proper ARIA labels
- Maintain focus states
- Ensure sufficient color contrast

#### Error Handling
- Handle network errors gracefully
- Show user-friendly error messages
- Allow retry on failed requests
- Validate date/time selections before submission

## Brand Colors Reference

```javascript
Primary Colors:
- 100: "#F9FAFA" (lightest)
- 200: "#DFE4EA"
- 300: "#DDDDDD"
- 400: "#9DABAF"
- 500: "#9CA3AF"
- 600: "#242424" (main text)
- 700: "#111928"
- 900: "#000000" (darkest)

Accent Colors:
- 100: "#FDF9E6" (light yellow)
- 300: "#EAC607" (gold/yellow)

Status Colors:
- Success: "#22AD5C" (green)
- Error: "#F23030" (red)
- Hover: "#033B4A" (dark teal)
- Disabled: "#EFEFEF" (light gray)
```

## Success Criteria

✅ Users can select dates from the calendar
✅ Available dates are visually distinct from unavailable dates
✅ Time slots display correctly with brand colors
✅ Selected time slot is clearly highlighted
✅ Appointment booking saves to CRM and database
✅ Calendar refreshes after successful booking
✅ Loading states are properly handled
✅ Error states are user-friendly
✅ Mobile and desktop experiences are optimized
✅ Brand colors are consistently applied

## Next Steps

1. Fix date selection functionality in CalendarDatePicker component
2. Implement month/year dropdown selector
3. Enhance visual distinction between available/unavailable dates
4. Style time slots with brand colors
5. Implement appointment persistence to CRM and database
6. Add calendar refresh after booking
7. Test on mobile and desktop
8. Verify all brand colors are correctly applied

