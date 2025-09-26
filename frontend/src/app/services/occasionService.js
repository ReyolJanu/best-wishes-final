import axios from 'axios';

export const getOccasionTypes = async () => {
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/occasion-types`);
    return response.data.occasionTypes;
  } catch (error) {
    console.error('Error fetching occasion types:', error);
    return [
      { value: 'birthday', label: '🎂 Birthday' },
      { value: 'anniversary', label: '💕 Anniversary' },
      { value: 'wedding', label: '💒 Wedding' },
      { value: 'graduation', label: '🎓 Graduation' },
      { value: 'baby_shower', label: '👶 Baby Shower' },
      { value: 'housewarming', label: '🏠 Housewarming' },
      { value: 'valentine_day', label: '💘 Valentine\'s Day' },
      { value: 'mother_day', label: '👩 Mother\'s Day' },
      { value: 'father_day', label: '👨 Father\'s Day' },
      { value: 'christmas', label: '🎄 Christmas' },
      { value: 'new_year', label: '🎊 New Year' },
      { value: 'thanksgiving', label: '🦃 Thanksgiving' },
      { value: 'engagement', label: '💍 Engagement' },
      { value: 'retirement', label: '🎯 Retirement' },
      { value: 'promotion', label: '📈 Promotion' },
      { value: 'get_well_soon', label: '🌸 Get Well Soon' },
      { value: 'sympathy', label: '🕊️ Sympathy' },
      { value: 'congratulations', label: '🎉 Congratulations' },
      { value: 'thank_you', label: '🙏 Thank You' },
      { value: 'general', label: '🎁 General Gift' }
    ];
  }
};