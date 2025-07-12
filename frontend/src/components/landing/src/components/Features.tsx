import React from 'react';
import { 
  MessageCircle, 
  Edit3, 
  ThumbsUp, 
  Tag, 
  Bell, 
  Users,
  Shield,
  Star,
  Image,
  Link,
  AlignLeft,
  Bold,
  Italic
} from 'lucide-react';

const Features: React.FC = () => {
  const features = [
    {
      icon: MessageCircle,
      title: "Ask Questions",
      description: "Submit questions with rich descriptions, tags, and formatting options",
      gradient: "bg-gradient-primary",
      details: ["Rich text editor", "Multi-select tags", "Image uploads", "Code snippets"]
    },
    {
      icon: Edit3,
      title: "Rich Text Editor",
      description: "Full-featured editor with formatting, images, and multimedia support",
      gradient: "bg-gradient-secondary",
      details: ["Bold, Italic, Strikethrough", "Lists and alignment", "Emoji & links", "Image uploads"]
    },
    {
      icon: ThumbsUp,
      title: "Voting System",
      description: "Upvote helpful answers and mark accepted solutions",
      gradient: "bg-gradient-success",
      details: ["Upvote/downvote answers", "Accept best answers", "Community validation", "Quality scoring"]
    },
    {
      icon: Tag,
      title: "Smart Tagging",
      description: "Organize questions with relevant tags for easy discovery",
      gradient: "bg-gradient-warning",
      details: ["Multi-select tags", "Auto-suggestions", "Tag filtering", "Popular tags"]
    },
    {
      icon: Bell,
      title: "Notifications",
      description: "Stay updated with real-time notifications and mentions",
      gradient: "bg-gradient-error",
      details: ["Answer notifications", "Comment alerts", "@mentions", "Real-time updates"]
    },
    {
      icon: Users,
      title: "Role Management",
      description: "Guest viewing, user participation, and admin moderation",
      gradient: "bg-gradient-primary",
      details: ["Guest access", "User registration", "Admin controls", "Content moderation"]
    }
  ];

  const editorFeatures = [
    { icon: Bold, name: "Bold" },
    { icon: Italic, name: "Italic" },
    { icon: AlignLeft, name: "Alignment" },
    { icon: Link, name: "Links" },
    { icon: Image, name: "Images" },
    { icon: Star, name: "Emojis" }
  ];

  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Powerful Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need for effective knowledge sharing and collaborative learning in one minimal platform
          </p>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100 group"
            >
              <div className={`inline-flex items-center justify-center w-16 h-16 ${feature.gradient} rounded-xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 mb-6 leading-relaxed">
                {feature.description}
              </p>
              
              <ul className="space-y-2">
                {feature.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-center text-sm text-gray-500">
                    <div className="w-1.5 h-1.5 bg-gradient-primary rounded-full mr-3"></div>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Editor showcase */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-gray-100">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              Rich Text Editor
            </h3>
            <p className="text-gray-600 text-lg">
              Professional editing tools for detailed questions and answers
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex flex-wrap gap-4 mb-6">
              {editorFeatures.map((tool, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <tool.icon className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">{tool.name}</span>
                </div>
              ))}
            </div>
            
            <div className="bg-white rounded-lg p-6 border border-gray-200 min-h-[200px]">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                How to implement user authentication in React?
              </h4>
              <p className="text-gray-600 leading-relaxed mb-4">
                I'm building a React application and need to implement user authentication. 
                Here's what I've tried so far:
              </p>
              <div className="bg-gray-100 rounded-lg p-4 font-mono text-sm text-gray-700 mb-4">
                const [user, setUser] = useState(null);
              </div>
              <p className="text-gray-600">
                Looking for best practices and security considerations...
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;